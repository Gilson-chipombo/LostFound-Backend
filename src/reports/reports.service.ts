import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReportStatus, OccurrenceStatus } from "@prisma/client";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, occurrenceId: string, reason: string) {
    const occurrence = await this.prisma.occurrence.findUnique({ where: { id: occurrenceId } });
    if (!occurrence) throw new NotFoundException("Ocorrência não encontrada.");

    return this.prisma.report.create({
      data: {
        reporterId,
        targetOccurrenceId: occurrenceId,
        reason,
        status: ReportStatus.PENDENTE,
      },
    });
  }

  async findAllAdmin() {
    const reports = await this.prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetOccurrence: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reports.map((r) => ({
      id: r.id,
      occurrenceTitle: r.targetOccurrence?.title || "Item removido",
      occurrenceId: r.targetOccurrenceId,
      reportedBy: r.reporter?.name || "Anónimo",
      reason: r.reason,
      date: r.createdAt.toISOString().split("T")[0],
      status: r.status.toLowerCase(),
    }));
  }

  async resolveReport(id: string, action: "APROVAR" | "SUSPENDER" | "REJEITAR") {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Denúncia não encontrada.");

    if (action === "SUSPENDER") {
      await this.prisma.occurrence.update({
        where: { id: report.targetOccurrenceId },
        data: { status: OccurrenceStatus.EM_ANALISE },
      });
      await this.prisma.report.update({
        where: { id },
        data: { status: ReportStatus.RESOLVIDO },
      });
    } else if (action === "APROVAR") {
      await this.prisma.report.update({
        where: { id },
        data: { status: ReportStatus.RESOLVIDO },
      });
    } else {
      await this.prisma.report.update({
        where: { id },
        data: { status: ReportStatus.REJEITADO },
      });
    }

    return { success: true };
  }
}
