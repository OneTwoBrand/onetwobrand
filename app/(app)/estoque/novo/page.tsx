import { getCollections } from '@/lib/catalog-data';
import { ProductForm } from './ProductForm';

export default async function NovoProdutoPage() {
  const { collections } = await getCollections();

  return <ProductForm collections={collections} />;
}
