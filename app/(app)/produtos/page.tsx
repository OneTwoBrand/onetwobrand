import { Package, Pencil, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Primitives';
import { getPieces } from '@/lib/catalog-data';
import { brl } from '@/lib/utils';
import { DeletePieceButton } from './[id]/DeletePieceButton';

export default async function ProdutosPage() {
  const { pieces, source } = await getPieces();

  const action = (
    <Link href="/produtos/novo">
      <Button size="sm" icon={<Plus size={14} />}>Novo produto</Button>
    </Link>
  );

  return (
    <>
      <AppBar large eyebrow="Produtos" title={`${pieces.length} produto${pieces.length !== 1 ? 's' : ''}`} action={action} />
      <Topbar eyebrow="Produtos" title={`${pieces.length} produto${pieces.length !== 1 ? 's' : ''}`} action={action} />
      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto max-w-5xl">
          {source === 'fallback' && (
            <div className="mb-4 flex items-center justify-between rounded-[14px] border border-line bg-paper px-4 py-3">
              <p className="text-[12px] text-ink-soft">Dados demonstrativos — faça login para carregar os produtos reais.</p>
              <Badge tone="warning" size="sm">Fallback</Badge>
            </div>
          )}

          <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 text-ink-soft">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-[13px]">Buscar produto, coleção ou cor</span>
          </div>

          {pieces.length === 0 ? (
            <Card pad={24}>
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Package size={26} strokeWidth={1.4} />
                </div>
                <p className="text-[14px] font-medium text-ink">Nenhum produto cadastrado</p>
                <p className="text-[12px] text-ink-soft">Adicione seu primeiro produto para começar.</p>
                <Link href="/produtos/novo">
                  <Button size="sm" icon={<Plus size={14} />}>Novo produto</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pieces.map((piece) => (
                <Card key={piece.id} pad={14}>
                  <div className="mb-2 flex justify-end gap-2">
                    <Link
                      href={`/produtos/${piece.id}/editar`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-primary hover:text-primary"
                      aria-label={`Editar ${piece.name}`}
                      title={`Editar ${piece.name}`}
                    >
                      <Pencil size={15} strokeWidth={1.7} />
                    </Link>
                    <DeletePieceButton pieceId={piece.id} name={piece.name} />
                  </div>
                  <div className="mb-3 flex aspect-[4/5] items-center justify-center rounded-[14px] border border-line bg-surface text-primary">
                    {piece.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={piece.photoUrl} alt={piece.name} className="h-full w-full rounded-[14px] object-cover" />
                    ) : (
                      <Package size={28} strokeWidth={1.4} />
                    )}
                  </div>
                  <h2 className="m-0 font-serif text-[18px] font-normal text-ink leading-tight">{piece.name}</h2>
                  <p className="mt-1 text-[11px] text-ink-soft">{piece.collectionName ?? 'Sem coleção'} · {piece.category ?? 'peça'}</p>
                  <p className="mt-1 text-[11px] text-ink-soft">{piece.color ?? piece.fabric ?? '—'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {piece.published && <Badge tone="success" size="sm">Publicado</Badge>}
                    {piece.featured && <Badge tone="primary" size="sm">Destaque</Badge>}
                  </div>
                  {piece.price > 0 && (
                    <p className="mt-1 font-serif text-[15px] text-ink">{brl(piece.price)}</p>
                  )}
                  {piece.costPrice > 0 && <p className="mt-1 text-[10px] text-ink-soft">Custo {brl(piece.costPrice)}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
