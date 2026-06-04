import { redirect } from 'next/navigation';

// Redirect permanente para manter compatibilidade com links externos e bookmarks
export default async function ColecaoSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/loja/colecoes/${slug}`);
}
