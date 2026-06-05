import { notFound, redirect } from 'next/navigation';
import { getPieceById, getCollections } from '@/lib/catalog-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { PieceForm } from '../../novo/PieceForm';

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ piece, source }, { collections }, workflowConfig] = await Promise.all([
    getPieceById(id),
    getCollections(),
    getWorkflowConfig(),
  ]);

  if (source !== 'supabase' || !piece) redirect(`/produtos`);
  if (!piece) notFound();

  return <PieceForm collections={collections} workflowConfig={workflowConfig} piece={piece} mode="edit" />;
}
