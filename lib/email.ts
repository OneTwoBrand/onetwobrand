import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'ONE TWO Brand <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

// ── shared HTML shell ──────────────────────────────────────────
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ONE TWO Brand</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#1A1A1A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#9E9688;">crafted pieces</p>
          <h1 style="margin:6px 0 0;font-size:26px;font-weight:400;color:#F7F5F2;letter-spacing:0.12em;">ONE&nbsp;TWO</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#FFFFFF;padding:40px;border-left:1px solid #E8E4DE;border-right:1px solid #E8E4DE;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F7F5F2;border:1px solid #E8E4DE;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9E9688;">
            Desenvolvido por Girassol Inteligência para ONE TWO Brand
          </p>
          <p style="margin:6px 0 0;font-size:10px;color:#B8B0A4;">
            Este é um e-mail automático. Não responda a esta mensagem.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── invite email ───────────────────────────────────────────────
export async function sendInviteEmail({
  to,
  fullName,
  role,
  inviteLink,
}: {
  to: string;
  fullName: string;
  role: string;
  inviteLink: string;
}) {
  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    atelier: 'Atelier',
    viewer: 'Visualizador',
  };

  const content = `
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9E9688;">Bem-vinda à plataforma</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1A1A1A;letter-spacing:0.04em;">Olá, ${fullName}</h2>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A4540;">
      Você foi convidada para acessar a plataforma <strong>ONE TWO Brand Manager</strong>
      com a função de <strong>${roleLabel[role] ?? role}</strong>.
    </p>

    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#4A4540;">
      Clique no botão abaixo para criar sua senha e ativar seu acesso.
      O link é válido por <strong>24 horas</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${inviteLink}"
           style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                  font-size:13px;letter-spacing:0.18em;text-transform:uppercase;
                  padding:14px 36px;border-radius:100px;">
          Ativar acesso
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:11px;color:#9E9688;line-height:1.6;">
      Se o botão não funcionar, copie e cole este link no navegador:<br/>
      <a href="${inviteLink}" style="color:#9E9688;word-break:break-all;">${inviteLink}</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Seu acesso ao ONE TWO Brand Manager',
    html: emailShell(content),
  });
}

// ── account status email ───────────────────────────────────────
export async function sendAccountStatusEmail({
  to,
  fullName,
  action,
}: {
  to: string;
  fullName: string;
  action: 'deactivated' | 'reactivated' | 'removed';
}) {
  const messages: Record<typeof action, { subject: string; headline: string; body: string; cta?: string }> = {
    deactivated: {
      subject: 'Seu acesso foi suspenso — ONE TWO Brand Manager',
      headline: `${fullName}, seu acesso foi suspenso`,
      body: 'Sua conta na plataforma ONE TWO Brand Manager foi <strong>desativada</strong> por um administrador. Você não poderá mais fazer login até que o acesso seja reativado.',
      cta: undefined,
    },
    reactivated: {
      subject: 'Seu acesso foi reativado — ONE TWO Brand Manager',
      headline: `${fullName}, seu acesso foi reativado`,
      body: 'Sua conta na plataforma ONE TWO Brand Manager foi <strong>reativada</strong>. Você já pode fazer login normalmente.',
      cta: SITE_URL + '/login',
    },
    removed: {
      subject: 'Sua conta foi removida — ONE TWO Brand Manager',
      headline: `${fullName}, sua conta foi removida`,
      body: 'Sua conta na plataforma ONE TWO Brand Manager foi <strong>removida</strong> por um administrador. Se acredita que isso foi um engano, entre em contato com a equipe ONE TWO.',
      cta: undefined,
    },
  };

  const msg = messages[action];

  const ctaBlock = msg.cta
    ? `<table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:24px 0;">
          <a href="${msg.cta}"
             style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                    font-size:13px;letter-spacing:0.18em;text-transform:uppercase;
                    padding:14px 36px;border-radius:100px;">
            Acessar plataforma
          </a>
        </td></tr>
      </table>`
    : '';

  const content = `
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9E9688;">Notificação de conta</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1A1A1A;letter-spacing:0.04em;">${msg.headline}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A4540;">${msg.body}</p>
    ${ctaBlock}
    <p style="margin:0;font-size:11px;color:#9E9688;line-height:1.6;">
      Esta mensagem foi enviada automaticamente pela plataforma ONE TWO Brand Manager.
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: msg.subject,
    html: emailShell(content),
  });
}

// ── password reset email ───────────────────────────────────────
export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  const content = `
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9E9688;">Recuperação de senha</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1A1A1A;letter-spacing:0.04em;">Redefinir sua senha</h2>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A4540;">
      Recebemos uma solicitação para redefinir a senha da sua conta no
      <strong>ONE TWO Brand Manager</strong>.
      Clique no botão abaixo para criar uma nova senha.
    </p>

    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#4A4540;">
      O link é válido por <strong>1 hora</strong>.
      Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${resetLink}"
           style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                  font-size:13px;letter-spacing:0.18em;text-transform:uppercase;
                  padding:14px 36px;border-radius:100px;">
          Redefinir senha
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:11px;color:#9E9688;line-height:1.6;">
      Se o botão não funcionar, copie e cole este link no navegador:<br/>
      <a href="${resetLink}" style="color:#9E9688;word-break:break-all;">${resetLink}</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Redefinir sua senha — ONE TWO Brand Manager',
    html: emailShell(content),
  });
}
