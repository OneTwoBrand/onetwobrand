'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { createCollection } from '../actions';

export default function NovaColecaoPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCollection, {});

  return (
    <>
      <AppBar title="Nova coleção" back onBack={() => router.back()} />
      <Topbar eyebrow="Coleções" title="Nova coleção" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Coleção</p>
            <div className="space-y-3">
              <Input name="name" label="Nome *" placeholder="Ex: Verão 2026" required />
              <Input name="category" label="Categoria" placeholder="Premium, Bordados, Casual..." />
              <Textarea name="description" label="Descrição" placeholder="Resumo criativo e operacional da coleção." />
            </div>
          </Card>
          {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>Voltar</Button>
            <Button type="submit" block disabled={pending}>{pending ? 'Salvando...' : 'Salvar coleção'}</Button>
          </div>
        </form>
      </main>
    </>
  );
}
