'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { createProduct } from './actions';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createProduct, {});

  return (
    <>
      <AppBar title="Novo Produto" back onBack={() => router.back()} />
      <Topbar eyebrow="Estoque" title="Novo Produto" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-xl">
          <form action={formAction} className="space-y-4">
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Identificação</p>
              <div className="space-y-3">
                <Input name="name" label="Nome do produto *" placeholder="Ex: Vestido Lis" required />
                <Input name="collection" label="Coleção" placeholder="Ex: Verão 2026" />
                <Input name="category" label="Categoria" placeholder="Ex: Vestido, Blusa, Conjunto…" />
              </div>
            </Card>
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Detalhes</p>
              <div className="space-y-3">
                <Input name="color" label="Cor / Tecido" placeholder="Ex: Linho cru" />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="cost_price" label="Custo (R$)" type="number" step="0.01" placeholder="0,00" />
                  <Input name="sale_price" label="Preço de venda (R$)" type="number" step="0.01" placeholder="0,00" />
                </div>
                <Input name="quantity" label="Quantidade em estoque *" type="number" min="0" placeholder="0" required />
              </div>
            </Card>
            {state?.error && (
              <p className="text-[12px] text-danger">{state.error}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
                Voltar
              </Button>
              <Button type="submit" block disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar produto'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
