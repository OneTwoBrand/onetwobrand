'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState } from 'react';
import { ChevronLeft, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { createProduct } from './actions';

type UploadState = 'idle' | 'uploading' | 'enhancing' | 'done' | 'error';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createProduct, {});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState('');
  const [productName, setProductName] = useState('');
  const [color, setColor] = useState('');

  async function handleFile(file: File) {
    setUploadState('uploading');
    setUploadError('');

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao fazer upload.');
      return;
    }

    setPhotoUrl(data.url);
    setUploadState('done');
  }

  async function handleEnhance() {
    if (!photoUrl) return;
    setUploadState('enhancing');
    setUploadError('');

    const res = await fetch('/api/ai/enhance-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: photoUrl, productName, color }),
    });
    const data = await res.json();

    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao melhorar imagem.');
      return;
    }

    setPhotoUrl(data.url);
    setUploadState('done');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      <AppBar title="Novo Produto" back onBack={() => router.back()} />
      <Topbar eyebrow="Estoque" title="Novo Produto" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-xl">
          <form action={formAction} className="space-y-4">
            {/* Hidden field for photo URL */}
            <input type="hidden" name="photo_url" value={photoUrl} />

            {/* Photo upload card */}
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
                Foto do produto
              </p>

              {photoUrl ? (
                <div className="space-y-3">
                  <div className="relative mx-auto w-full max-w-[240px]">
                    <div className="aspect-[4/5] overflow-hidden rounded-[14px] border border-line">
                      <Image
                        src={photoUrl}
                        alt="Foto do produto"
                        width={240}
                        height={300}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPhotoUrl(''); setUploadState('idle'); }}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper border border-line text-ink-soft hover:text-danger shadow-sm"
                      aria-label="Remover foto"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      icon={<Sparkles size={14} />}
                      onClick={handleEnhance}
                      disabled={uploadState === 'enhancing'}
                      block
                    >
                      {uploadState === 'enhancing' ? 'Refinando…' : 'Refinar foto'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Trocar
                    </Button>
                  </div>

                  {uploadState === 'enhancing' && (
                    <p className="text-center text-[11px] text-ink-soft">
                      Refinando luz, nitidez e enquadramento em padrão editorial…
                    </p>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-line bg-surface py-10 transition-colors hover:border-primary hover:bg-primary-soft/30"
                >
                  {uploadState === 'uploading' ? (
                    <>
                      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-[12px] text-ink-soft">Enviando e convertendo para WebP…</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                        <Upload size={22} strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-ink">Clique ou arraste a foto</p>
                        <p className="mt-1 text-[11px] text-ink-soft">JPG, PNG, HEIC ou WebP · até 20 MB</p>
                        <p className="mt-0.5 text-[10px] text-ink-soft">Convertida automaticamente para WebP 4:5</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="mt-2 text-[12px] text-danger">{uploadError}</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp"
                aria-label="Selecionar foto do produto"
                title="Selecionar foto do produto"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </Card>

            {/* Identification */}
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Identificação</p>
              <div className="space-y-3">
                <Input
                  name="name"
                  label="Nome do produto *"
                  placeholder="Ex: Vestido Lis"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <Input name="collection" label="Coleção" placeholder="Ex: Verão 2026" disabled />
                <Input name="category" label="Categoria" placeholder="Ex: Vestido, Blusa, Conjunto…" disabled />
              </div>
            </Card>

            {/* Details */}
            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Detalhes</p>
              <div className="space-y-3">
                <Input
                  name="color"
                  label="Cor / Tecido"
                  placeholder="Ex: Linho cru"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <Input name="size" label="Tamanho" placeholder="Ex: P, M, G ou Único" defaultValue="Único" />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="cost_price" label="Custo (R$)" type="number" step="0.01" placeholder="0,00" disabled />
                  <Input name="sale_price" label="Preço de venda (R$)" type="number" step="0.01" placeholder="0,00" />
                </div>
                <Input name="quantity" label="Quantidade em estoque *" type="number" min="0" placeholder="0" required />
              </div>
            </Card>

            {state?.error && (
              <p className="text-[12px] text-danger">{state.error}</p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
                Voltar
              </Button>
              <Button type="submit" block disabled={pending || uploadState === 'uploading' || uploadState === 'enhancing'}>
                {pending ? 'Salvando…' : 'Salvar produto'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
