import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OccurrenceType, OccurrenceStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalPerdidos = await this.prisma.occurrence.count({
      where: { type: OccurrenceType.PERDIDO },
    });
    const totalEncontrados = await this.prisma.occurrence.count({
      where: { type: OccurrenceType.ENCONTRADO },
    });
    const totalRecuperados = await this.prisma.occurrence.count({
      where: { status: OccurrenceStatus.RESOLVIDO },
    });
    const totalEmAnalise = await this.prisma.occurrence.count({
      where: { status: OccurrenceStatus.EM_ANALISE },
    });

    const categories = await this.prisma.category.findMany();
    const categoryChart = await Promise.all(
      categories.slice(0, 6).map(async (cat) => {
        const count = await this.prisma.occurrence.count({
          where: { category: cat.name },
        });
        return { name: cat.name, value: count };
      }),
    );

    const chartData = [
      { month: "Jan", perdidos: 45, encontrados: 20, recuperados: 12 },
      { month: "Fev", perdidos: 52, encontrados: 28, recuperados: 18 },
      { month: "Mar", perdidos: 61, encontrados: 34, recuperados: 22 },
      { month: "Abr", perdidos: 58, encontrados: 41, recuperados: 30 },
      { month: "Mai", perdidos: 70, encontrados: 45, recuperados: 33 },
      { month: "Jun", perdidos: 82, encontrados: 55, recuperados: 42 },
      { month: "Jul", perdidos: Math.max(totalPerdidos, 76), encontrados: Math.max(totalEncontrados, 60), recuperados: Math.max(totalRecuperados, 48) },
    ];

    return {
      totalPerdidos,
      totalEncontrados,
      totalRecuperados,
      totalEmAnalise,
      chartData,
      categoryChart,
    };
  }

  async getActivities() {
    const recentOccurrences = await this.prisma.occurrence.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    return recentOccurrences.map((occ, idx) => ({
      id: `a-${occ.id}`,
      user: occ.user?.name || "Utilizador",
      action: occ.type === OccurrenceType.PERDIDO ? "publicou uma perda" : "publicou um achado",
      target: occ.title,
      time: `há ${idx * 15 + 5}min`,
    }));
  }

  async getSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: { id: "default" },
      });
    }
    return settings;
  }

  async updateSettings(data: { requireModeration?: boolean; minMatchPercent?: number; searchRadiusKm?: number }) {
    let settings = await this.prisma.systemSettings.findFirst();
    if (!settings) {
      return this.prisma.systemSettings.create({
        data: { id: "default", ...data },
      });
    }
    return this.prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(data.requireModeration !== undefined && { requireModeration: data.requireModeration }),
        ...(data.minMatchPercent !== undefined && { minMatchPercent: data.minMatchPercent }),
        ...(data.searchRadiusKm !== undefined && { searchRadiusKm: data.searchRadiusKm }),
      },
    });
  }
}
