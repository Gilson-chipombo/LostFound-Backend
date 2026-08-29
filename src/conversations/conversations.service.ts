import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        participantA: true,
        participantB: true,
        occurrence: true,
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((conv) => {
      const otherUser = conv.participantAId === userId ? conv.participantB : conv.participantA;
      const lastMsg = conv.messages[0];

      return {
        id: conv.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
        },
        occurrenceTitle: conv.occurrence?.title || "Conversa direta",
        lastMessage: lastMsg?.text || "",
        lastMessageTime: lastMsg ? this.formatTime(lastMsg.sentAt) : "",
        unread: false,
      };
    });
  }

  async getMessages(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) throw new NotFoundException("Conversa não encontrada.");
    if (conv.participantAId !== userId && conv.participantBId !== userId) {
      throw new ForbiddenException("Acesso negado a esta conversa.");
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: "asc" },
    });

    return messages.map((m) => ({
      id: m.id,
      fromMe: m.senderId === userId,
      text: m.text,
      time: this.formatTime(m.sentAt),
      sentAt: m.sentAt,
    }));
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participantA: true,
        participantB: true,
      },
    });

    if (!conv) throw new NotFoundException("Conversa não encontrada.");
    if (conv.participantAId !== senderId && conv.participantBId !== senderId) {
      throw new ForbiddenException("Acesso negado.");
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const sender = conv.participantAId === senderId ? conv.participantA : conv.participantB;
    const recipient = conv.participantAId === senderId ? conv.participantB : conv.participantA;

    // Criar notificação interna no sistema para o destinatário
    if (recipient?.id) {
      await this.prisma.notification.create({
        data: {
          userId: recipient.id,
          title: `Nova mensagem de ${sender.name}`,
          description: text.length > 80 ? text.substring(0, 80) + "..." : text,
        },
      }).catch(() => {});
    }

    if (recipient?.email) {
      this.mailService.sendChatMessageNotification(
        recipient.email,
        recipient.name,
        sender.name,
        text.length > 100 ? text.substring(0, 100) + "..." : text,
      ).catch(() => {});
    }

    return {
      id: message.id,
      fromMe: true,
      text: message.text,
      time: this.formatTime(message.sentAt),
      sentAt: message.sentAt,
    };
  }

  async createOrGetConversation(userId: string, targetUserId: string, occurrenceId?: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participantAId: userId, participantBId: targetUserId },
          { participantAId: targetUserId, participantBId: userId },
        ],
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participantAId: userId,
        participantBId: targetUserId,
        occurrenceId,
      },
    });
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
  }
}
