import { Package } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Primitives';

export default function EstoquePage() {
  return (
    <>
      <AppBar large eyebrow="Estoque" title="218 peças · 42 SKUs" />
      <Topbar eyebrow="Estoque" title="218 peças · 42 SKUs" />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
          {['Vestido Lis', 'Blusa Íris', 'Conjunto Hera', 'Saia Margarida'].map((item) => (
            <Card key={item} pad={14}>
              <div className="mb-3 flex aspect-[4/5] items-center justify-center rounded-[14px] border border-line bg-surface text-primary">
                <Package size={28} strokeWidth={1.4} />
              </div>
              <h2 className="m-0 font-serif text-[18px] font-normal text-ink">{item}</h2>
              <p className="mt-1 text-[11px] text-ink-soft">Linho cru · P · M · G</p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
