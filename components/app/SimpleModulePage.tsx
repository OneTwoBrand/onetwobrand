import { type ReactNode } from 'react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Primitives';

export function SimpleModulePage({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) {
  return (
    <>
      <AppBar large eyebrow={eyebrow} title={title} />
      <Topbar eyebrow={eyebrow} title={title} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <Card className="mx-auto max-w-3xl text-center" pad={28}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            {icon}
          </div>
          <h1 className="m-0 font-serif text-[28px] font-normal text-ink">Módulo em preparação</h1>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-ink-soft">
            A base visual e técnica já está pronta para receber os fluxos detalhados deste módulo no próximo ciclo.
          </p>
        </Card>
      </main>
    </>
  );
}
