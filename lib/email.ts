import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? 'ONE TWO Brand <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

// ── shared HTML shell ──────────────────────────────────────────
function emailShell(content: string, accentColor = '#1A1A1A'): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ONE TWO Brand</title>
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE8;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

        <!-- Header com marca -->
        <tr><td style="background:${accentColor};border-radius:20px 20px 0 0;padding:36px 48px 28px;text-align:center;">
          <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#9E9688;">crafted pieces</p>
          <h1 style="margin:0;font-size:30px;font-weight:300;color:#F7F5F2;letter-spacing:0.16em;line-height:1;">ONE&nbsp;&nbsp;TWO</h1>
          <div style="margin:18px auto 0;width:32px;height:1px;background:#9E9688;opacity:0.6;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#FFFFFF;padding:44px 48px;border-left:1px solid #E2DDD7;border-right:1px solid #E2DDD7;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F0EDE8;border:1px solid #E2DDD7;border-top:none;border-radius:0 0 20px 20px;padding:22px 48px;text-align:center;">
          <p style="margin:0;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#A09890;">
            Desenvolvido por Girassol Inteligência para ONE TWO Brand
          </p>
          <p style="margin:6px 0 0;font-size:10px;color:#B8B0A4;line-height:1.5;">
            Este é um e-mail automático — por favor, não responda a esta mensagem.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Linha divisória reutilizável
const divider = `<div style="margin:28px 0;height:1px;background:#EDE9E3;"></div>`;

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
    admin: 'Administradora',
    atelier: 'Atelier',
    viewer: 'Visualizadora',
  };

  const roleIcon: Record<string, string> = {
    admin: '✦',
    atelier: '✿',
    viewer: '◎',
  };

  const icon = roleIcon[role] ?? '✦';
  const label = roleLabel[role] ?? role;

  const content = `
    <!-- Saudação -->
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#A09890;">Bem-vinda</p>
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:300;color:#1A1A1A;letter-spacing:0.03em;line-height:1.2;">Olá, ${fullName} 👋</h2>
    <p style="margin:0 0 28px;font-size:13px;color:#9E9688;letter-spacing:0.02em;">Você tem um convite esperando por você.</p>

    <!-- Card de função -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#F7F5F2;border:1px solid #EDE9E3;border-radius:12px;padding:18px 22px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#A09890;">Sua função na plataforma</p>
        <p style="margin:0;font-size:16px;font-weight:400;color:#1A1A1A;letter-spacing:0.04em;">${icon}&nbsp;&nbsp;${label}</p>
      </td></tr>
    </table>

    <!-- Texto principal -->
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#4A4540;">
      Você foi convidada para acessar o <strong style="color:#1A1A1A;">ONE TWO Brand Manager</strong> — a plataforma interna de gestão do atelier.
    </p>
    <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#4A4540;">
      Para ativar sua conta, clique no botão abaixo e <strong style="color:#1A1A1A;">crie sua senha</strong>. O link é pessoal, válido por <strong style="color:#1A1A1A;">24 horas</strong> e pode ser usado apenas uma vez.
    </p>

    <!-- CTA principal -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:32px;">
        <a href="${inviteLink}"
           style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                  font-size:12px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;
                  padding:16px 44px;border-radius:100px;line-height:1;">
          Criar minha senha
        </a>
      </td></tr>
    </table>

    ${divider}

    <!-- Próximos passos -->
    <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#A09890;">O que acontece agora?</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;vertical-align:top;width:24px;">
          <span style="font-size:13px;color:#1A1A1A;font-weight:500;">1.</span>
        </td>
        <td style="padding:6px 0;font-size:13px;color:#4A4540;line-height:1.6;">
          Clique em "Criar minha senha" e escolha uma senha segura.
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;vertical-align:top;width:24px;">
          <span style="font-size:13px;color:#1A1A1A;font-weight:500;">2.</span>
        </td>
        <td style="padding:6px 0;font-size:13px;color:#4A4540;line-height:1.6;">
          Você será redirecionada automaticamente para o login.
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;vertical-align:top;width:24px;">
          <span style="font-size:13px;color:#1A1A1A;font-weight:500;">3.</span>
        </td>
        <td style="padding:6px 0;font-size:13px;color:#4A4540;line-height:1.6;">
          Entre com seu e-mail e a senha que você acabou de criar.
        </td>
      </tr>
    </table>

    ${divider}

    <!-- Link alternativo -->
    <p style="margin:0;font-size:11px;color:#A09890;line-height:1.7;">
      Se o botão não funcionar, copie e cole este link diretamente no navegador:<br/>
      <a href="${inviteLink}" style="color:#A09890;word-break:break-all;text-decoration:underline;">${inviteLink}</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${fullName}, seu acesso ao ONE TWO Brand Manager está pronto`,
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
  const messages: Record<typeof action, { subject: string; eyebrow: string; headline: string; body: string; cta?: string; accent?: string }> = {
    deactivated: {
      subject: 'Seu acesso foi suspenso — ONE TWO Brand Manager',
      eyebrow: 'Notificação de conta',
      headline: `Acesso suspenso`,
      body: `Olá, <strong>${fullName}</strong>.<br/><br/>Sua conta no <strong>ONE TWO Brand Manager</strong> foi <strong>desativada</strong> por uma administradora. Enquanto isso, você não conseguirá fazer login na plataforma.<br/><br/>Se acredita que isso foi um engano, entre em contato com a equipe ONE TWO.`,
      cta: undefined,
    },
    reactivated: {
      subject: 'Seu acesso foi reativado — ONE TWO Brand Manager',
      eyebrow: 'Notificação de conta',
      headline: `Acesso reativado`,
      body: `Olá, <strong>${fullName}</strong>.<br/><br/>Boa notícia! Sua conta no <strong>ONE TWO Brand Manager</strong> foi <strong>reativada</strong>. Você já pode acessar a plataforma normalmente.`,
      cta: SITE_URL + '/login',
    },
    removed: {
      subject: 'Sua conta foi removida — ONE TWO Brand Manager',
      eyebrow: 'Notificação de conta',
      headline: `Conta removida`,
      body: `Olá, <strong>${fullName}</strong>.<br/><br/>Sua conta no <strong>ONE TWO Brand Manager</strong> foi <strong>removida</strong> por uma administradora.<br/><br/>Se acredita que isso foi um engano, entre em contato com a equipe ONE TWO.`,
      cta: undefined,
    },
  };

  const msg = messages[action];

  const ctaBlock = msg.cta
    ? `<table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:28px 0 8px;">
          <a href="${msg.cta}"
             style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                    font-size:12px;letter-spacing:0.22em;text-transform:uppercase;
                    padding:16px 44px;border-radius:100px;">
            Acessar plataforma
          </a>
        </td></tr>
      </table>`
    : '';

  const content = `
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#A09890;">${msg.eyebrow}</p>
    <h2 style="margin:0 0 28px;font-size:24px;font-weight:300;color:#1A1A1A;letter-spacing:0.03em;">${msg.headline}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#4A4540;">${msg.body}</p>
    ${ctaBlock}
    ${divider}
    <p style="margin:0;font-size:11px;color:#A09890;line-height:1.6;">
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
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#A09890;">Segurança da conta</p>
    <h2 style="margin:0 0 6px;font-size:26px;font-weight:300;color:#1A1A1A;letter-spacing:0.03em;">Redefinir senha</h2>
    <p style="margin:0 0 28px;font-size:13px;color:#9E9688;">ONE TWO Brand Manager</p>

    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#4A4540;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
    </p>
    <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#4A4540;">
      O link é válido por <strong style="color:#1A1A1A;">1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:32px;">
        <a href="${resetLink}"
           style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;
                  font-size:12px;letter-spacing:0.22em;text-transform:uppercase;
                  padding:16px 44px;border-radius:100px;">
          Redefinir minha senha
        </a>
      </td></tr>
    </table>

    ${divider}

    <p style="margin:0;font-size:11px;color:#A09890;line-height:1.7;">
      Se o botão não funcionar, copie e cole este link no navegador:<br/>
      <a href="${resetLink}" style="color:#A09890;word-break:break-all;text-decoration:underline;">${resetLink}</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Redefinir sua senha — ONE TWO Brand Manager',
    html: emailShell(content),
  });
}
