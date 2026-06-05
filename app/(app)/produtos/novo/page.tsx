import { getCollections } from '@/lib/catalog-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { PieceForm } from './PieceForm';

export default async function NovoProdutoPage() {
  const [{ collections }, workflowConfig] = await Promise.all([
    getCollections(),
    getWorkflowConfig(),
  ]);

  return <PieceForm collections={collections} workflowConfig={workflowConfig} />;
}
