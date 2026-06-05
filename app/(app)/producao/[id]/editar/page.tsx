import { notFound, redirect } from 'next/navigation';
import { getProductionOrderDetail } from '@/lib/production/orders';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { getSeamstresses } from '@/lib/app-data';
import { EditOPForm } from './EditOPForm';

export default async function EditarOPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ order, source }, wfConfig, { seamstresses }] = await Promise.all([
    getProductionOrderDetail(id),
    getWorkflowConfig(),
    getSeamstresses(),
  ]);

  if (source !== 'supabase' || !order.id) redirect(`/producao/${id}`);
  if (!order.id) notFound();

  const activeSeamstresses = seamstresses.filter((s) => s.active !== false);

  return (
    <EditOPForm
      params={params}
      order={order}
      seamstresses={activeSeamstresses.map((s) => ({ id: s.id, name: s.name }))}
      allStatuses={wfConfig.op_statuses}
      embroideryTypes={wfConfig.embroidery_types}
    />
  );
}
