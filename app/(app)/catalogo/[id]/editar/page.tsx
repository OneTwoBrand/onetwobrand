import { notFound } from 'next/navigation';
import { getCollectionById } from '@/lib/catalog-data';
import { EditarColecaoForm } from './EditarColecaoForm';

export default async function EditarColecaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { collection } = await getCollectionById(id);
  if (!collection) notFound();

  return <EditarColecaoForm collection={collection} />;
}
