import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = this.configService.get<number>("SMTP_PORT") || 587;
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Serviço de email configurado para host ${host}`);
    } else {
      this.logger.warn("Credenciais SMTP não configuradas. Os e-mails serão registados no log de sistema.");
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const from = this.configService.get<string>("SMTP_FROM") || '"Lost&Found Luanda" <no-reply@achadosluanda.ao>';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ""),
          html,
        });
        this.logger.log(`E-mail enviado com sucesso para ${to} (Assunto: ${subject})`);
      } catch (err: any) {
        this.logger.error(`Erro ao enviar e-mail para ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[SIMULAÇÃO E-MAIL] Para: ${to} | Assunto: ${subject}\nConteúdo: ${text || html.replace(/<[^>]*>?/gm, "")}`);
    }
  }

  async sendMatchNotification(userEmail: string, userName: string, occurrenceTitle: string, matchPercent: number, matchTitle: string) {
    const subject = `[Lost&Found Luanda] Nova correspondência (${matchPercent}%) encontrada!`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2563eb;">Olá, ${userName}!</h2>
        <p>Encontrámos uma possível correspondência com a sua ocorrência <strong>"${occurrenceTitle}"</strong> com uma afinidade de <strong>${matchPercent}%</strong>.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold;">${matchTitle}</p>
        </div>
        <p>Aceda ao seu painel em <strong>Achados Luanda</strong> para ver os detalhes e entrar em contacto.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br />Equipa Lost&Found Luanda</p>
      </div>
    `;
    await this.sendMail(userEmail, subject, html);
  }

  async sendStatusUpdateNotification(userEmail: string, userName: string, occurrenceTitle: string, newStatus: string) {
    const subject = `[Lost&Found Luanda] O estado da sua ocorrência foi atualizado`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2563eb;">Olá, ${userName}!</h2>
        <p>A sua ocorrência <strong>"${occurrenceTitle}"</strong> teve o seu estado alterado para: <span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${newStatus.toUpperCase()}</span>.</p>
        <p>Se tiver alguma dúvida, aceda à plataforma para consultar a sua publicação.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br />Equipa Lost&Found Luanda</p>
      </div>
    `;
    await this.sendMail(userEmail, subject, html);
  }

  async sendChatMessageNotification(userEmail: string, userName: string, senderName: string, messagePreview: string) {
    const subject = `[Lost&Found Luanda] Nova mensagem de ${senderName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2563eb;">Olá, ${userName}!</h2>
        <p>Recebeu uma nova mensagem de <strong>${senderName}</strong> no chat do Lost&Found Luanda:</p>
        <blockquote style="background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 12px 16px; margin: 16px 0; font-style: italic;">
          "${messagePreview}"
        </blockquote>
        <p>Aceda ao seu espaço pessoal para responder à mensagem.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br />Equipa Lost&Found Luanda</p>
      </div>
    `;
    await this.sendMail(userEmail, subject, html);
  }
}
