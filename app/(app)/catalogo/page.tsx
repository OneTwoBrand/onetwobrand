import Link from 'next/link';
import { Layers3, Plus } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { DataNotice } from '@/components/app/DataNotice';
import { Button } from '@/components/ui/Button';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { Input } from '@/components/ui/Input';
import { getCollections } from '@/lib/catalog-data';
import { updateCollectionHighlight } from './actions';
import { DeleteCollectionButton } from './DeleteCollectionButton';

export default async function ColecoesPage() {
  const { collections, source, error } = await getCollections();

  return (
    <>
      <AppBar large eyebrow="Coleções" title={`${collections.length} linhas`} action={<Link href="/catalogo/novo"><Button size="sm" icon={<Plus size={14} />}>Nova</Button></Link>} />
      <Topbar eyebrow="Coleções" title={`${collections.length} linhas`} action={<Link href="/catalogo/novo"><Button size="sm" icon={<Plus size={14} />}>Nova coleção</Button></Link>} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl">
          <DataNotice source={source} error={error} />
          <SectionHead eyebrow="Portfólio" title="Coleções ativas" />
          <div className="grid gap-3 md:grid-cols-3">
            {collections.map((collection) => (
              <Card key={collection.id} pad={18}>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary">
                    <Layers3 size={18} />
                  </div>
                  <DeleteCollectionButton id={collection.id} name={collection.name} />
                </div>
                <h2 className="m-0 font-serif text-[22px] font-normal text-ink">{collection.name}</h2>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft">{collection.category ?? 'Sem categoria'}</p>
                <form action={updateCollectionHighlight} className="mt-4 rounded-[12px] border border-line bg-surface p-3">
                  <input type="hidden" name="id" value={collection.id} />
                  <label className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={Boolean(collection.featured)}
                      className="h-4 w-4 accent-primary"
                    />
                    Destacar na home
                  </label>
                  <div className="flex items-end gap-2">
                    <Input
                      name="featured_order"
                      label="Ordem"
                      type="number"
                      min="0"
                      defaultValue={collection.featuredOrder ?? 0}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" variant="soft">Salvar</Button>
                  </div>
                  {!collection.publishedAt && (
                    <p className="mt-2 text-[10px] text-ink-mute">Publique a coleção para aparecer na loja.</p>
                  )}
                </form>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
