require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;

  console.log(`Iniciando teste de envio para fernandochipombo@gmail.com...`);
  console.log(`Configuração: USER=${user} | HOST=${host}:${port}`);

  if (!user || !pass) {
    throw new Error('EMAIL_USER ou EMAIL_PASS não estão definidos no ficheiro .env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: `"Lost&Found Luanda" <${user}>`,
    to: 'fernandochipombo@gmail.com',
    subject: '[Lost&Found Luanda] E-mail de Teste do Sistema de Alertas 🇦🇴',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">🇦🇴 Teste de Notificações - Lost&Found Luanda</h2>
        <p>Olá <strong>Fernando Chipombo</strong>,</p>
        <p>Este é um e-mail de teste para confirmar que a integração do sistema de alertas por e-mail está a funcionar com sucesso!</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-left: 4px solid #2563eb; margin: 16px 0; border-radius: 6px;">
          <p style="margin: 0; font-weight: bold; color: #0f172a;">Estado do Sistema de Alertas: ATIVO ✅</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">As correspondências automáticas, notificações de chat e atualizações de estado serão enviadas em tempo real.</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">Lost&Found Luanda • Plataforma Comunitária de Objetos Perdidos</p>
      </div>
    `,
  });

  console.log('✅ E-mail de teste enviado com sucesso!');
  console.log('Message ID:', info.messageId);
}

main().catch((err) => {
  console.error('❌ Erro no teste de e-mail:', err.message || err);
});
