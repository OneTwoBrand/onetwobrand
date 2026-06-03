import { getCollections } from '@/lib/catalog-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { ProductForm } from './ProductForm';

export default async function NovoProdutoPage() {
  const [{ collections }, workflowConfig] = await Promise.all([
    getCollections(),
    getWorkflowConfig(),
  ]);

  return <ProductForm collections={collections} workflowConfig={workflowConfig} />;
}
