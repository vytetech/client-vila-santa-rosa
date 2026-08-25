import nodemailer from "nodemailer";

/**
 * SMTP is configured through environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * When they are not set, emails are skipped and the reset link is logged
 * to the server log instead (the link still works).
 */
function smtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!smtpConfigured()) {
    console.log(`[mail] SMTP não configurado — link de redefinição para ${to}: ${resetUrl}`);
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Vila Santa Rosa — Redefinição de senha",
    html: `
      <div style="font-family:system-ui;background:#fdf6f3;padding:24px">
        <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:32px">
          <h2 style="color:#c73e72;margin-top:0">Redefinir sua senha</h2>
          <p>Recebemos um pedido para redefinir a senha da sua conta na Vila Santa Rosa.</p>
          <p>Se foi você, clique no botão abaixo (o link vale por 1 hora):</p>
          <p style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="background:#c73e72;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">
              Redefinir senha
            </a>
          </p>
          <p style="color:#888;font-size:13px">Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.</p>
        </div>
      </div>`,
  });
  return true;
}
