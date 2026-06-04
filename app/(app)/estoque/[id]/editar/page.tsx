import { notFound } from 'next/navigation';
import { getCatalogStockItem, getCollections } from '@/lib/catalog-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { ProductForm } from '../../novo/ProductForm';

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ product }, { collections }, workflowConfig] = await Promise.all([
    getCatalogStockItem(id),
    getCollections(),
    getWorkflowConfig(),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      mode="edit"
      product={product}
      collections={collections}
      workflowConfig={workflowConfig}
    />
  );
}
