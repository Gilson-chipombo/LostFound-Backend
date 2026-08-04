import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return list.map((n) => ({
      id: n.id,
      title: n.title,
      desc: n.description,
      time: this.formatRelativeTime(n.createdAt),
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  async markAsRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException("Notificação não encontrada.");
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  private formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "há momentos";
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  }
}
