/**
 * ONE TWO · Shop transactional emails
 * Reutiliza o shell HTML já existente em lib/email.ts.
 * Confirmação de pedido, mudança de fase e entrega.
 */
import { Resend } from 'resend';
import { brl } from '@/lib/utils';
import type { OrderSummary } from './checkout-actions';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'ONE TWO · Loja <noreply@one2brand.com.br>';
const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://one2brand.com.br';

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>ONE TWO</title>
</head>
<body style="margin:0;padding:0;background:#F1E0A8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1E0A8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:#6F1628;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#FBF6E4;opacity:0.7;">crafted pieces</p>
          <h1 style="margin:6px 0 0;font-size:26px;font-weight:300;color:#FBF6E4;letter-spacing:0.12em;">ONE&nbsp;TWO</h1>
        </td></tr>
        <tr><td style="background:#FBF6E4;padding:40px;border-left:1px solid rgba(61,26,26,0.10);border-right:1px solid rgba(61,26,26,0.10);">
          ${content}
        </td></tr>
        <tr><td style="background:#F7EAC0;border:1px solid rgba(61,26,26,0.10);border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9C8B73;">
            Desenvolvido por Girassol Inteligência para ONE TWO
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** E-mail de confirmação de pedido enviado ao cliente. */
export async function sendOrderConfirmationEmail(order: OrderSummary) {
  const itemsHtml = order.items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(61,26,26,0.08);">
        <span style="font-size:13px;color:#3D1A1A;">${i.pieceName}</span>
        <span style="font-size:11px;color:#9C8B73;margin-left:8px;">Tam ${i.size}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(61,26,26,0.08);text-align:right;font-size:13px;color:#3D1A1A;">
        ${i.qty}× ${brl(i.unitPrice, { decimals: true })}
      </td>
    </tr>
  `).join('');

  const content = `
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#9C8B73;">Pedido confirmado</p>
    <h2 style="margin:0 0 6px;font-size:28px;font-weight:300;color:#3D1A1A;font-family:Georgia,serif;">Obrigada,<br/><em>${order.customerName.split(' ')[0]}.</em></h2>
    <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#6B5A47;">
      Seu pedido entrou no fluxo de produção do atelier. Vamos te avisar a cada etapa.
    </p>

    <div style="background:#F7EAC0;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9C8B73;">
        Pedido ${order.orderNumber}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
        <tr>
          <td style="padding-top:14px;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#3D1A1A;">Total</td>
          <td style="padding-top:14px;text-align:right;font-size:16px;font-weight:500;color:#3D1A1A;font-family:Georgia,serif;">
            ${brl(order.total, { decimals: true })}
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="${SITE}/conta/pedidos"
           style="display:inline-block;background:#6F1628;color:#FBF6E4;text-decoration:none;
                  font-size:11px;letter-spacing:0.20em;text-transform:uppercase;
                  padding:14px 36px;border-radius:100px;">
          Acompanhar pedido
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:11px;color:#9C8B73;line-height:1.6;text-align:center;">
      Confirmação enviada para ${order.customerEmail}
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to:   order.customerEmail,
    subject: `Pedido ${order.orderNumber} confirmado — ONE TWO`,
    html: shell(content),
  });
}

/** E-mail de atualização de fase da OP. */
export async function sendOrderStatusEmail({
  to, customerName, orderNumber, stage, progressPct,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  stage: string;
  progressPct: number;
}) {
  const content = `
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#9C8B73;">Atualização do pedido</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:300;color:#3D1A1A;font-family:Georgia,serif;">
      Seu pedido avançou, ${customerName.split(' ')[0]}.
    </h2>
    <div style="background:#F7EAC0;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9C8B73;">Pedido ${orderNumber}</p>
      <p style="margin:0 0 14px;font-size:16px;color:#3D1A1A;font-family:Georgia,serif;">${stage}</p>
      <div style="background:rgba(61,26,26,0.10);border-radius:9999px;height:6px;">
        <div style="background:#6F1628;border-radius:9999px;height:6px;width:${progressPct}%;"></div>
      </div>
      <p style="margin:6px 0 0;font-size:10px;color:#9C8B73;text-align:right;">${progressPct}% concluído</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${SITE}/conta/pedidos"
           style="display:inline-block;background:#6F1628;color:#FBF6E4;text-decoration:none;
                  font-size:11px;letter-spacing:0.20em;text-transform:uppercase;
                  padding:14px 36px;border-radius:100px;">
          Ver status completo
        </a>
      </td></tr>
    </table>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${stage} — Pedido ${orderNumber} · ONE TWO`,
    html: shell(content),
  });
}
