import { Bot, MessageSquare, PenLine, Sparkles } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Primitives';

const plannedFeatures = [
  { title: 'Chat interno', body: 'Perguntas sobre produção, vendas, estoque e financeiro.', Icon: MessageSquare },
  { title: 'Preenchimento assistido', body: 'Observações, cadastros, descrições e anotações.', Icon: PenLine },
  { title: 'Resumos operacionais', body: 'Sínteses de produção, financeiro, estoque e vendas.', Icon: Sparkles },
];

export default function AssistantPage() {
  return (
    <>
      <AppBar large eyebrow="Concierge digital" title="OneTwo Assistant" />
      <Topbar eyebrow="Concierge digital" title="OneTwo Assistant" />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden bg-primary text-paper" pad={24}>
            <div className="relative z-10 max-w-2xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper/15">
                <Bot size={24} strokeWidth={1.5} />
              </div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-paper/70">
                Módulo futuro
              </p>
              <h1 className="m-0 font-serif text-[34px] font-normal leading-[1.05] md:text-[48px]">
                Assistente operacional da ONE TWO
              </h1>
              <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-paper/78 md:text-[14px]">
                Área preparada para chat, geração de conteúdo, resumos e preenchimento assistido.
                Toda integração de IA deverá acontecer exclusivamente pelo servidor.
              </p>
            </div>
          </Card>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {plannedFeatures.map(({ title, body, Icon }) => (
              <Card key={title} pad={18}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={19} strokeWidth={1.5} />
                </div>
                <h2 className="m-0 font-serif text-[21px] font-normal text-ink">{title}</h2>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{body}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-5" pad={18}>
            <p className="m-0 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              Segurança
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              A IA não deve inventar dados operacionais, assumir informações inexistentes ou alterar
              registros sem confirmação explícita.
            </p>
          </Card>
        </section>
      </main>
    </>
  );
}
