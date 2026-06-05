import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSeamstresses } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { NovaOPForm } from './NovaOPForm';

export default async function NewProductionOrderPage() {
  const [{ seamstresses }, wfConfig] = await Promise.all([
    getSeamstresses(),
    getWorkflowConfig(),
  ]);

  const activeSeamstresses = seamstresses.filter((s) => s.active !== false);

  return (
    <>
      <AppBar
        title="Nova OP"
        back
        action={
          <Link href="/producao" className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            Cancelar
          </Link>
        }
      />
      <Topbar
        eyebrow="Produção"
        title="Nova ordem"
        action={
          <Link href="/producao">
            <Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button>
          </Link>
        }
      />
      <NovaOPForm
        seamstresses={activeSeamstresses.map((s) => ({ id: s.id, name: s.name }))}
        embroideryTypes={wfConfig.embroidery_types}
        sizes={wfConfig.product_sizes}
        collections={wfConfig.product_categories}
      />
    </>
  );
}
