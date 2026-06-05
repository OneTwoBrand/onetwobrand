import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { getPlatformConfig } from '@/lib/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Perguntas frequentes · ONE TWO',
  description: 'Tudo que você precisa saber sobre as peças, pedidos, entrega e atendimento do atelier ONE TWO.',
};

type FaqItem = { pergunta: string; resposta: string };

const FALLBACK: FaqItem[] = [
  { pergunta: 'As peças são feitas à mão mesmo?', resposta: 'Sim, de verdade. Cada peça passa pelas mãos das nossas costureiras antes de chegar até você. Não tem robô, não tem linha de montagem — tem gente de verdade com muito cuidado no processo.' },
  { pergunta: 'Tem estoque disponível ou é tudo sob encomenda?', resposta: 'Depende da peça! Algumas estão disponíveis imediatamente, outras são produzidas depois do seu pedido. A própria página do produto deixa claro quando é o caso.' },
  { pergunta: 'Como sei qual tamanho escolher?', resposta: 'Na página de cada produto há um guia de medidas. Se ainda ficou com dúvida, pergunte pelo WhatsApp antes de comprar — a vendedora conhece cada peça e ajuda a escolher.' },
  { pergunta: 'Quanto tempo demora para meu pedido chegar?', resposta: 'São alguns dias úteis de produção + o prazo de entrega do frete escolhido. Você pode conferir o prazo estimado direto na página do produto. Valeu a espera, prometemos.' },
  { pergunta: 'O frete é grátis?', resposta: 'Temos frete grátis a partir de um determinado valor — confira na página de checkout. Abaixo desse valor, o frete é calculado de acordo com o seu endereço.' },
  { pergunta: 'Quais formas de pagamento vocês aceitam?', resposta: 'Cartão de crédito, PIX (com 5% de desconto!) e boleto bancário. Se preferir negociar direto com a vendedora, pode usar o WhatsApp no checkout.' },
  { pergunta: 'Posso devolver se não gostei?', resposta: 'Como as peças são feitas sob encomenda, não aceitamos devoluções por desistência. Mas se chegou com defeito de fabricação, a gente resolve — prazo de 7 dias após o recebimento.' },
  { pergunta: 'Posso pedir uma peça em cor ou tamanho diferente?', resposta: 'Essa é uma boa pergunta para a nossa vendedora! Use o WhatsApp e ela te explica o que é possível. A gente gosta de personalizar quando dá.' },
  { pergunta: 'Vocês têm loja física?', resposta: 'Somos um atelier, então o atendimento é por agendamento. Se quiser visitar, fala pelo WhatsApp antes de aparecer de surpresa — a gente pode estar costurando com fone de ouvido.' },
];

export default async function FaqPage() {
  const saved = await getPlatformConfig('shop_faq');
  let items: FaqItem[] = FALLBACK;
  if (saved?.trim()) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch {
      // use fallback
    }
  }

  return (
    <div className="max-w-[680px] mx-auto pt-4 pb-20">
      <Link
        href="/loja"
        className="inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute hover:text-ink transition-colors mb-8"
      >
        <ChevronLeft size={13} /> Voltar à loja
      </Link>

      <h1 className="font-serif text-[32px] font-light text-ink leading-tight mb-2">
        Perguntas frequentes
      </h1>
      <p className="text-[12px] text-ink-soft tracking-[0.12em] uppercase mb-10">
        Tudo que você precisa saber · ONE TWO Atelier
      </p>

      <div className="space-y-2">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-[14px] border border-line bg-paper overflow-hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[13px] font-medium text-ink select-none hover:bg-surface transition-colors">
              <span>{item.pergunta}</span>
              <ChevronDown
                size={16}
                className="shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="px-5 pb-4 pt-1 text-[13px] text-ink-soft leading-[1.7]">
              {item.resposta}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 rounded-[16px] bg-surface border border-line p-6">
        <p className="text-[12px] text-ink-soft leading-[1.6]">
          Não encontrou o que procurava? A gente responde pelo WhatsApp ou e-mail —
          os links estão no rodapé. Prometemos não demorar.
        </p>
      </div>
    </div>
  );
}
