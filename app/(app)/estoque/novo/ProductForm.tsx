'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState } from 'react';
import { ChevronLeft, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import type { CollectionOption } from '@/lib/catalog-data';
import { createProduct } from './actions';

type UploadState = 'idle' | 'uploading' | 'enhancing' | 'done' | 'error';
type PhotoField = 'photo_url' | 'back_photo_url' | 'detail_photo_url';

export function ProductForm({ collections }: { collections: CollectionOption[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createProduct, {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFieldRef = useRef<PhotoField>('photo_url');

  const [photos, setPhotos] = useState<Record<PhotoField, string>>({ photo_url: '', back_photo_url: '', detail_photo_url: '' });
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

    setPhotos((current) => ({ ...current, [activeFieldRef.current]: data.url }));
    setUploadState('done');
  }

  async function handleEnhance(field: PhotoField) {
    const imageUrl = photos[field];
    if (!imageUrl) return;
    setUploadState('enhancing');
    setUploadError('');

    const res = await fetch('/api/ai/enhance-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, productName, color }),
    });
    const data = await res.json();

    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao refinar imagem.');
      return;
    }

    setPhotos((current) => ({ ...current, [field]: data.url }));
    setUploadState('done');
  }

  function chooseFile(field: PhotoField) {
    activeFieldRef.current = field;
    fileInputRef.current?.click();
  }

  return (
    <>
      <AppBar title="Novo Produto" back onBack={() => router.back()} />
      <Topbar eyebrow="Estoque" title="Novo Produto" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-3xl">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="photo_url" value={photos.photo_url} />
            <input type="hidden" name="back_photo_url" value={photos.back_photo_url} />
            <input type="hidden" name="detail_photo_url" value={photos.detail_photo_url} />

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Fotos</p>
              <div className="grid gap-3 md:grid-cols-3">
                <PhotoUploader title="Principal" value={photos.photo_url} state={uploadState} onChoose={() => chooseFile('photo_url')} onEnhance={() => handleEnhance('photo_url')} onRemove={() => setPhotos((current) => ({ ...current, photo_url: '' }))} />
                <PhotoUploader title="Traseira" value={photos.back_photo_url} state={uploadState} onChoose={() => chooseFile('back_photo_url')} onEnhance={() => handleEnhance('back_photo_url')} onRemove={() => setPhotos((current) => ({ ...current, back_photo_url: '' }))} />
                <PhotoUploader title="Detalhe" value={photos.detail_photo_url} state={uploadState} onChoose={() => chooseFile('detail_photo_url')} onEnhance={() => handleEnhance('detail_photo_url')} onRemove={() => setPhotos((current) => ({ ...current, detail_photo_url: '' }))} />
              </div>
              {uploadError && <p className="mt-2 text-[12px] text-danger">{uploadError}</p>}
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

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Identificação</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="name" label="Nome do produto *" placeholder="Ex: Vestido Lis" required value={productName} onChange={(e) => setProductName(e.target.value)} />
                <Select name="collection_id" label="Coleção">
                  <option value="">Sem coleção</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </Select>
                <Input name="category" label="Categoria" placeholder="Ex: Vestido, Blusa, Conjunto" />
                <Input name="fabric" label="Tecido" placeholder="Ex: Linho" />
                <Input name="color" label="Cor" placeholder="Ex: Cru" value={color} onChange={(e) => setColor(e.target.value)} />
                <Input name="size" label="Tamanho" placeholder="Ex: P, M, G ou Único" defaultValue="Único" />
              </div>
              <Textarea className="mt-3" name="description" label="Descrição" placeholder="Descrição da peça, acabamento, bordado, coleção..." />
            </Card>

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Preço e estoque</p>
              <div className="grid gap-3 md:grid-cols-4">
                <Input name="cost_price" label="Custo" type="number" step="0.01" placeholder="0,00" />
                <Input name="sale_price" label="Preço venda" type="number" step="0.01" placeholder="0,00" />
                <Input name="quantity" label="Estoque *" type="number" min="0" placeholder="0" required />
                <Input name="low_threshold" label="Mínimo" type="number" min="0" defaultValue="3" />
              </div>
            </Card>

            {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>Voltar</Button>
              <Button type="submit" block disabled={pending || uploadState === 'uploading' || uploadState === 'enhancing'}>{pending ? 'Salvando...' : 'Salvar produto'}</Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function PhotoUploader({
  title,
  value,
  state,
  onChoose,
  onEnhance,
  onRemove,
}: {
  title: string;
  value: string;
  state: UploadState;
  onChoose: () => void;
  onEnhance: () => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-ink-soft">{title}</p>
      {value ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] border border-line">
            <Image src={value} alt={`Foto ${title}`} width={240} height={300} className="h-full w-full object-cover" />
            <button type="button" onClick={onRemove} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft" aria-label="Remover foto">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={onChoose}>Trocar</Button>
            <Button type="button" size="sm" variant="soft" icon={<Sparkles size={13} />} onClick={onEnhance} disabled={state === 'enhancing'}>{state === 'enhancing' ? '...' : 'Refinar'}</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onChoose} className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line bg-surface text-ink-soft">
          {state === 'uploading' ? <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload size={22} />}
          <span className="text-[11px]">{state === 'uploading' ? 'Enviando...' : 'Adicionar'}</span>
        </button>
      )}
    </div>
  );
}
