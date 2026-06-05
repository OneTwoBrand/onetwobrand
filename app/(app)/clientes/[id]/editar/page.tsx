import { notFound, redirect } from 'next/navigation';
import { getClientDetail } from '@/lib/app-data';
import { EditClientForm } from './EditClientForm';

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, source } = await getClientDetail(id);

  if (source !== 'supabase' || !client) redirect(`/clientes/${id}`);
  if (!client) notFound();

  return <EditClientForm client={client} />;
}
