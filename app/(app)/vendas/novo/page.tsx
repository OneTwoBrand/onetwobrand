import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { MultiStepProgress } from '@/components/app/Composites';
import { Button } from '@/components/ui/Button';
import { Card, SectionHead } from '@/components/ui/Primitives';

const steps = ['Cliente', 'Peças', 'Qtd', 'Pagto', 'Concluir'];

export default function NovaVendaPage() {
  return (
    <>
      <AppBar title="Nova venda" back />
      <Topbar eyebrow="Vendas" title="Nova venda" action={<Link href="/vendas"><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-4xl">
          <MultiStepProgress steps={steps} current={1} />
          <Card pad={22}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <ShoppingCart size={22} />
            </div>
            <SectionHead eyebrow="Passo 1/5" title="Selecionar cliente" />
            <p className="max-w-xl text-[13px] leading-relaxed text-ink-soft">
              O fluxo visual já está preparado. No próximo sprint, este passo será conectado ao cadastro real de clientes e ao carrinho de peças.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Card pad={14} className="bg-surface">
                <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Fluxo</p>
                <p className="mt-2 text-[13px] text-ink">Cliente → Peças → Quantidade → Pagamento → Concluir</p>
              </Card>
              <Card pad={14} className="bg-surface">
                <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">Estoque</p>
                <p className="mt-2 text-[13px] text-ink">Baixa automática será aplicada ao confirmar pagamento.</p>
              </Card>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
