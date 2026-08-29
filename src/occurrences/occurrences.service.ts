import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MatchingService } from "./matching.service";
import { CreateOccurrenceDto } from "./dto/create-occurrence.dto";
import { UpdateOccurrenceDto } from "./dto/update-occurrence.dto";
import { QueryOccurrenceDto } from "./dto/query-occurrence.dto";
import { OccurrenceType, OccurrenceStatus, Role } from "@prisma/client";

import { MailService } from "../mail/mail.service";

@Injectable()
export class OccurrencesService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService,
    private mailService: MailService,
  ) {}

  async findAll(query: QueryOccurrenceDto) {
    const { type, category, municipality, search, status } = query;
    const where: any = {};

    if (type) {
      const typeUpper = type.toUpperCase() as OccurrenceType;
      if (Object.values(OccurrenceType).includes(typeUpper)) {
        where.type = typeUpper;
      }
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (municipality) {
      where.municipality = { equals: municipality, mode: "insensitive" };
    }

    if (status) {
      if (status.toLowerCase() !== "all") {
        const statusUpper = status.toUpperCase() as OccurrenceStatus;
        if (Object.values(OccurrenceStatus).includes(statusUpper)) {
          where.status = statusUpper;
        }
      }
    } else {
      // Por padrão, lista apenas ocorrências ATIVO a não ser que especificado
      where.status = OccurrenceStatus.ATIVO;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }

    const occurrences = await this.prisma.occurrence.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return occurrences.map((occ) => this.formatOccurrence(occ));
  }

  async findOne(id: string) {
    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!occurrence) {
      throw new NotFoundException(`Ocorrência com ID ${id} não foi encontrada.`);
    }

    // Calcular correspondências sugeridas
    const matches = await this.findMatches(occurrence);

    return {
      ...this.formatOccurrence(occurrence),
      matches,
    };
  }

  async create(userId: string, dto: CreateOccurrenceDto) {
    // Obter configuração de moderação
    const settings = await this.prisma.systemSettings.findFirst();
    const initialStatus = settings?.requireModeration
      ? OccurrenceStatus.EM_ANALISE
      : OccurrenceStatus.ATIVO;

    const occurrence = await this.prisma.occurrence.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        brand: dto.brand,
        model: dto.model,
        color: dto.color,
        features: dto.features || [],
        municipality: dto.municipality,
        neighborhood: dto.neighborhood,
        location: dto.location,
        date: new Date(dto.date),
        status: initialStatus,
        images: dto.images || [],
        contactPhone: dto.contactPhone,
        contactWhatsapp: dto.contactWhatsapp,
        contactEmail: dto.contactEmail,
      },
      include: { user: true },
    });

    // Se estiver ativo, gerar verificações de match em segundo plano e criar notificação se aplicável
    if (initialStatus === OccurrenceStatus.ATIVO) {
      this.checkAndNotifyMatches(occurrence);
    }

    return this.formatOccurrence(occurrence);
  }

  async update(id: string, userId: string, role: Role, dto: UpdateOccurrenceDto) {
    const existing = await this.prisma.occurrence.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ocorrência com ID ${id} não encontrada.`);
    }

    if (existing.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException("Não tem permissão para editar esta ocorrência.");
    }

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.brand && { brand: dto.brand }),
        ...(dto.model && { model: dto.model }),
        ...(dto.color && { color: dto.color }),
        ...(dto.features && { features: dto.features }),
        ...(dto.municipality && { municipality: dto.municipality }),
        ...(dto.neighborhood && { neighborhood: dto.neighborhood }),
        ...(dto.location && { location: dto.location }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.status && { status: dto.status }),
        ...(dto.images && { images: dto.images }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.contactWhatsapp !== undefined && { contactWhatsapp: dto.contactWhatsapp }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      },
      include: { user: true },
    });

    return this.formatOccurrence(updated);
  }

  async updateStatus(id: string, userId: string, role: Role, status: OccurrenceStatus) {
    const existing = await this.prisma.occurrence.findUnique({ where: { id }, include: { user: true } });
    if (!existing) {
      throw new NotFoundException(`Ocorrência com ID ${id} não encontrada.`);
    }

    if (existing.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException("Não tem permissão para alterar o estado desta ocorrência.");
    }

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: { status },
      include: { user: true },
    });

    // Criar notificação interna no sistema
    await this.prisma.notification.create({
      data: {
        userId: existing.userId,
        title: "Estado da ocorrência atualizado",
        description: `O estado da sua ocorrência "${existing.title}" foi alterado para ${status.toLowerCase()}.`,
      },
    }).catch(() => {});

    // Enviar e-mail de notificação de alteração de estado
    if (existing.user?.email) {
      this.mailService.sendStatusUpdateNotification(
        existing.user.email,
        existing.user.name,
        existing.title,
        status,
      ).catch(() => {});
    }

    return this.formatOccurrence(updated);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await this.prisma.occurrence.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ocorrência com ID ${id} não encontrada.`);
    }

    if (existing.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException("Não tem permissão para eliminar esta ocorrência.");
    }

    await this.prisma.occurrence.delete({ where: { id } });
    return { success: true, message: "Ocorrência eliminada com sucesso." };
  }

  async getPublicStats() {
    const [totalOccurrences, resolvedOccurrences, totalUsers] = await Promise.all([
      this.prisma.occurrence.count(),
      this.prisma.occurrence.count({ where: { status: OccurrenceStatus.RESOLVIDO } }),
      this.prisma.user.count(),
    ]);

    const successRate = totalOccurrences > 0 ? Math.round((resolvedOccurrences / totalOccurrences) * 100) : 0;

    return {
      totalOccurrences,
      resolvedOccurrences,
      totalUsers,
      successRate: `${successRate}%`,
    };
  }

  async findMatches(source: any) {
    if (source.type === OccurrenceType.AVISO) {
      return [];
    }

    const targetType =
      source.type === OccurrenceType.PERDIDO
        ? OccurrenceType.ENCONTRADO
        : OccurrenceType.PERDIDO;

    const candidates = await this.prisma.occurrence.findMany({
      where: {
        type: targetType,
        status: OccurrenceStatus.ATIVO,
        id: { not: source.id },
      },
      include: { user: true },
    });

    const settings = await this.prisma.systemSettings.findFirst();
    const minPercent = settings?.minMatchPercent || 50;

    const matchedList = candidates
      .map((candidate) => {
        const matchPercent = this.matchingService.calculateMatchScore(source, candidate);
        return {
          ...this.formatOccurrence(candidate),
          matchPercent,
        };
      })
      .filter((item) => item.matchPercent >= minPercent)
      .sort((a, b) => b.matchPercent - a.matchPercent);

    return matchedList;
  }

  private async checkAndNotifyMatches(occurrence: any) {
    try {
      const matches = await this.findMatches(occurrence);
      if (matches.length > 0) {
        const topMatch = matches[0];

        // 1. Notificar o autor da nova ocorrência publicada (Pessoa A)
        await this.prisma.notification.create({
          data: {
            userId: occurrence.userId,
            title: "Nova correspondência encontrada!",
            description: `Encontramos uma correspondência de ${topMatch.matchPercent}% para "${occurrence.title}".`,
          },
        }).catch(() => {});

        if (occurrence.user?.email) {
          this.mailService.sendMatchNotification(
            occurrence.user.email,
            occurrence.user.name,
            occurrence.title,
            topMatch.matchPercent,
            topMatch.title,
          ).catch(() => {});
        }

        // 2. Notificar o autor da correspondência existente (Pessoa B)
        if (topMatch.userId && topMatch.userId !== occurrence.userId) {
          await this.prisma.notification.create({
            data: {
              userId: topMatch.userId,
              title: "Nova correspondência encontrada!",
              description: `A sua publicação "${topMatch.title}" tem uma correspondência de ${topMatch.matchPercent}% com uma nova publicação.`,
            },
          }).catch(() => {});

          const topMatchUser = await this.prisma.user.findUnique({ where: { id: topMatch.userId } });
          if (topMatchUser?.email) {
            this.mailService.sendMatchNotification(
              topMatchUser.email,
              topMatchUser.name,
              topMatch.title,
              topMatch.matchPercent,
              occurrence.title,
            ).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      console.error("Erro ao processar notificações de correspondência:", err);
    }
  }

  private formatOccurrence(occ: any) {
    return {
      id: occ.id,
      type: occ.type.toLowerCase(),
      title: occ.title,
      description: occ.description,
      category: occ.category,
      brand: occ.brand || undefined,
      model: occ.model || undefined,
      color: occ.color || undefined,
      features: occ.features || [],
      municipality: occ.municipality,
      neighborhood: occ.neighborhood,
      location: occ.location,
      date: occ.date ? new Date(occ.date).toISOString().split("T")[0] : "",
      status: occ.status.toLowerCase(),
      images: occ.images || [],
      contact: {
        phone: occ.contactPhone || undefined,
        whatsapp: occ.contactWhatsapp || undefined,
        email: occ.contactEmail || undefined,
      },
      author: occ.user?.name || "Anónimo",
      userId: occ.userId,
      createdAt: occ.createdAt,
    };
  }
}
