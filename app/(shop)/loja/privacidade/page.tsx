import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de privacidade · ONE TWO',
  description: 'Como o atelier ONE TWO coleta, usa e protege seus dados pessoais.',
};

export default function PrivacidadePage() {
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
        Última atualização: junho de 2026 · ONE TWO Atelier
      </p>

      <div className="space-y-8 text-[14px] text-ink-soft leading-[1.7]">

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Quem somos</h2>
          <p>
            ONE TWO é um atelier de moda artesanal que produz peças em pequenas tiragens.
            Esta política descreve como coletamos e usamos seus dados quando você realiza uma compra
            ou nos contata.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Dados que coletamos</h2>
          <p>Coletamos apenas os dados necessários para processar seu pedido:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>Nome completo</li>
            <li>Endereço de e-mail</li>
            <li>Número de telefone</li>
            <li>Endereço de entrega</li>
            <li>Dados de pagamento (processados de forma segura pela Stripe ou MercadoPago — não armazenamos dados de cartão)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Como usamos seus dados</h2>
          <p>Seus dados são usados exclusivamente para:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>Processar e entregar seu pedido</li>
            <li>Comunicar atualizações sobre o status da produção e entrega</li>
            <li>Responder às suas dúvidas e solicitações</li>
            <li>Cumprir obrigações legais e fiscais</li>
          </ul>
          <p className="mt-3">
            <strong className="text-ink font-medium">Não vendemos, alugamos ou compartilhamos seus dados</strong> com
            terceiros para fins comerciais.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Armazenamento e segurança</h2>
          <p>
            Seus dados são armazenados em servidores seguros (Supabase/AWS) com criptografia em trânsito (TLS)
            e em repouso. O acesso é restrito à equipe responsável pelo atendimento e produção.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Cookies</h2>
          <p>
            Utilizamos apenas cookies estritamente necessários para o funcionamento da loja
            (sessão do carrinho e preferências de navegação). Não usamos cookies de rastreamento
            ou publicidade de terceiros.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Seus direitos (LGPD)</h2>
          <p>
            Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar os dados que temos sobre você</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-3">
            Para exercer qualquer desses direitos, entre em contato pelo e-mail ou WhatsApp disponíveis no rodapé.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-[20px] font-normal text-ink mb-3">Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. A data de última atualização estará sempre
            indicada no topo desta página. O uso continuado da loja após alterações implica aceitação
            da política vigente.
          </p>
        </section>

      </div>

      <div className="mt-12 rounded-[16px] bg-surface border border-line p-6">
        <p className="text-[12px] text-ink-soft leading-[1.6]">
          Dúvidas sobre privacidade? Entre em contato — tratamos suas informações com o mesmo cuidado
          que colocamos em cada peça.
        </p>
      </div>
    </div>
  );
}
