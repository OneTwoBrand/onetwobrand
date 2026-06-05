import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSeamstresses } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { EditarRemessaForm } from './EditarRemessaForm';

export default async function EditarRemessaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: shipment }, { seamstresses }, wfConfig] = await Promise.all([
    supabase
      .from('embroidery_shipments')
      .select('id, code, seamstress_id, embroidery_type, qty, sent_at, expected_return_at, value, status')
      .eq('id', id)
      .single(),
    getSeamstresses(),
    getWorkflowConfig(),
  ]);

  if (!shipment) notFound();

  return (
    <EditarRemessaForm
      shipment={shipment}
      seamstresses={seamstresses.map((s) => ({ id: s.id, name: s.name }))}
      embroideryTypes={wfConfig.embroidery_types}
    />
  );
}
