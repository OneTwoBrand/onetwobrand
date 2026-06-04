import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trocas e devoluções · ONE TWO',
  description: 'Política de trocas e devoluções do atelier ONE TWO.',
};

export default function TrocasPage() {
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

      <div className="space-y-8 text-[14px] text-ink-soft leading-[1.7]">

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Peças sob encomenda</h2>
          <p>
            Todas as peças ONE TWO são produzidas artesanalmente sob encomenda após a confirmação do pedido.
            Por essa razão, <strong className="text-ink font-medium">não realizamos trocas ou devoluções por arrependimento</strong> em
            peças feitas sob medida ou personalizadas.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Defeito de fabricação</h2>
          <p>
            Caso sua peça apresente defeito de fabricação comprovado, você tem até <strong className="text-ink font-medium">7 dias corridos</strong> após
            o recebimento para nos contatar. Envie fotos detalhadas do problema para o nosso WhatsApp ou e-mail.
          </p>
          <p className="mt-3">
            Após análise, realizaremos o conserto sem custo, a substituição da peça (sujeito à disponibilidade de material)
            ou o reembolso integral, a nosso critério e conforme disponibilidade.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Prazo de envio para troca</h2>
          <p>
            A peça deve ser devolvida em até <strong className="text-ink font-medium">14 dias corridos</strong> após a autorização,
            sem sinais de uso, com etiquetas originais e na embalagem original sempre que possível.
            O frete de devolução é de responsabilidade do cliente, exceto nos casos de defeito comprovado.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Como entrar em contato</h2>
          <p>
            Fale conosco pelo WhatsApp ou pelo e-mail listado no rodapé da loja. Informe o número do pedido,
            descreva o problema e anexe fotos se possível. Respondemos em até 2 dias úteis.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Reembolso</h2>
          <p>
            Reembolsos aprovados são processados no mesmo meio de pagamento utilizado na compra,
            em até <strong className="text-ink font-medium">10 dias úteis</strong> após a confirmação da devolução.
            Para pagamentos via cartão de crédito, o prazo pode variar conforme a operadora.
          </p>
        </section>

      </div>

      <div className="mt-12 rounded-[16px] bg-surface border border-line p-6">
        <p className="text-[12px] text-ink-soft leading-[1.6]">
          Esta política está em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990).
          Dúvidas? Entre em contato — adoramos ouvir nossas clientes.
        </p>
      </div>
    </div>
  );
}
