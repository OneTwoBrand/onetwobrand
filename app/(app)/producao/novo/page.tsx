import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSeamstresses } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { getPieces } from '@/lib/catalog-data';
import { NovaOPForm } from './NovaOPForm';

export default async function NewProductionOrderPage() {
  const [{ seamstresses }, wfConfig, { pieces }] = await Promise.all([
    getSeamstresses(),
    getWorkflowConfig(),
    getPieces(),
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
        products={pieces.map((p) => ({ id: p.id, name: p.name, color: p.color, category: p.category, collectionName: p.collectionName }))}
      />
    </>
  );
}
