import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getPlatformConfig } from '@/lib/platform-config';
import { parsePageContent } from '@/lib/shop/parse-page-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trocas e devoluções · ONE TWO',
  description: 'Política de trocas e devoluções do atelier ONE TWO.',
};

const FALLBACK = `## Peças sob encomenda
Todas as peças ONE TWO são produzidas artesanalmente sob encomenda após a confirmação do pedido. Por essa razão, **não realizamos trocas ou devoluções por arrependimento** em peças feitas sob medida ou personalizadas.

## Defeito de fabricação
Caso sua peça apresente defeito de fabricação comprovado, você tem até **7 dias corridos** após o recebimento para nos contatar. Envie fotos detalhadas do problema para o nosso WhatsApp ou e-mail. Após análise, realizaremos o conserto sem custo, a substituição da peça ou o reembolso integral.

## Prazo de envio para troca
A peça deve ser devolvida em até **14 dias corridos** após a autorização, sem sinais de uso, com etiquetas originais e na embalagem original sempre que possível. O frete de devolução é de responsabilidade do cliente, exceto nos casos de defeito comprovado.

## Como entrar em contato
Fale conosco pelo WhatsApp ou pelo e-mail listado no rodapé da loja. Informe o número do pedido, descreva o problema e anexe fotos se possível. Respondemos em até 2 dias úteis.

## Reembolso
Reembolsos aprovados são processados no mesmo meio de pagamento utilizado na compra, em até **10 dias úteis** após a confirmação da devolução. Para pagamentos via cartão de crédito, o prazo pode variar conforme a operadora.`;

export default async function TrocasPage() {
  const saved = await getPlatformConfig('shop_page_trocas');
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
        Trocas e devoluções
      </h1>
      <p className="text-[12px] text-ink-soft tracking-[0.12em] uppercase mb-10">
        Política vigente · ONE TWO Atelier
      </p>

      <div
        className="space-y-0 text-[14px] text-ink-soft leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="mt-12 rounded-[16px] bg-surface border border-line p-6">
        <p className="text-[12px] text-ink-soft leading-[1.6]">
          Esta política está em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990).
          Dúvidas? Entre em contato — adoramos ouvir nossas clientes.
        </p>
      </div>
    </div>
  );
}
