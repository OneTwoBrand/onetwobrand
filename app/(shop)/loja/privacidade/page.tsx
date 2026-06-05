import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getPlatformConfig } from '@/lib/platform-config';
import { parsePageContent } from '@/lib/shop/parse-page-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Política de privacidade · ONE TWO',
  description: 'Como o atelier ONE TWO coleta, usa e protege seus dados pessoais.',
};

const FALLBACK = `## Quem somos
ONE TWO é um atelier de moda artesanal que produz peças em pequenas tiragens. Esta política descreve como coletamos e usamos seus dados quando você realiza uma compra ou nos contata.

## Dados que coletamos
Coletamos apenas os dados necessários para processar seu pedido: nome completo, e-mail, telefone, endereço de entrega e dados de pagamento (processados pela Stripe ou MercadoPago — não armazenamos dados de cartão).

## Como usamos seus dados
Seus dados são usados exclusivamente para processar e entregar seu pedido, comunicar atualizações de produção e entrega, responder dúvidas e cumprir obrigações legais. **Não vendemos, alugamos ou compartilhamos seus dados** com terceiros para fins comerciais.

## Armazenamento e segurança
Seus dados são armazenados em servidores seguros (Supabase/AWS) com criptografia em trânsito (TLS) e em repouso. O acesso é restrito à equipe responsável pelo atendimento e produção.

## Cookies
Utilizamos apenas cookies estritamente necessários para o funcionamento da loja (sessão do carrinho e preferências de navegação). Não usamos cookies de rastreamento ou publicidade de terceiros.

## Seus direitos (LGPD)
Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a confirmar a existência de tratamento dos seus dados, acessar, corrigir ou solicitar a exclusão, e revogar o consentimento a qualquer momento. Para exercer qualquer desses direitos, entre em contato pelo e-mail ou WhatsApp disponíveis no rodapé.

## Alterações nesta política
Podemos atualizar esta política periodicamente. A data de última atualização estará sempre indicada no topo desta página.`;

export default async function PrivacidadePage() {
  const saved = await getPlatformConfig('shop_page_privacidade');
  const content = saved?.trim() || FALLBACK;
  const html = parsePageContent(content);

  return (
    <div className="max-w-[680px] mx-auto pt-4 pb-20">
      <Link
        href="/loja"
        className="inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute hover:text-ink transition-colors mb-8"
      >
        <ChevronLeft size={13} /> Voltar à loja
      </Link>

      <h1 className="font-serif text-[32px] font-light text-ink leading-tight mb-2">
        Política de privacidade
      </h1>
      <p className="text-[12px] text-ink-soft tracking-[0.12em] uppercase mb-10">
        ONE TWO Atelier
      </p>

      <div
        className="space-y-0 text-[14px] text-ink-soft leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="mt-12 rounded-[16px] bg-surface border border-line p-6">
        <p className="text-[12px] text-ink-soft leading-[1.6]">
          Dúvidas sobre privacidade? Entre em contato — tratamos suas informações com o mesmo cuidado
          que colocamos em cada peça.
        </p>
      </div>
    </div>
  );
}
