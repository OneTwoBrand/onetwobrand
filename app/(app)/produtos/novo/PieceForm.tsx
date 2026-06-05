'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, Maximize2, MoveHorizontal, MoveVertical, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MaskedInput';
import { Card } from '@/components/ui/Primitives';
import type { PieceItem, CollectionOption } from '@/lib/catalog-data';
import type { WorkflowConfig } from '@/lib/workflow-config';
import { createPiece, updatePiece } from './actions';

type UploadState = 'idle' | 'uploading' | 'enhancing' | 'done' | 'error';
type PhotoField = 'photo_url' | 'back_photo_url' | 'detail_photo_url';
type PhotoFit = { zoom: number; offsetX: number; offsetY: number };

const DEFAULT_FIT: PhotoFit = { zoom: 1, offsetX: 0, offsetY: 0 };

type PieceFormProps = {
  collections: CollectionOption[];
  workflowConfig: WorkflowConfig;
  piece?: PieceItem;
  mode?: 'create' | 'edit';
};

function fitFormData(file: File, fit: PhotoFit) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('zoom', String(fit.zoom));
  fd.append('offsetX', String(fit.offsetX));
  fd.append('offsetY', String(fit.offsetY));
  return fd;
}

export function PieceForm({ collections, workflowConfig, piece, mode = 'create' }: PieceFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [state, formAction, pending] = useActionState(isEdit ? updatePiece : createPiece, {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFieldRef = useRef<PhotoField>('photo_url');

  const [photos, setPhotos] = useState<Record<PhotoField, string>>({
    photo_url: piece?.photoUrl ?? '',
    back_photo_url: piece?.backPhotoUrl ?? '',
    detail_photo_url: piece?.detailPhotoUrl ?? '',
  });
  const [photoFiles, setPhotoFiles] = useState<Record<PhotoField, File | null>>({ photo_url: null, back_photo_url: null, detail_photo_url: null });
  const [photoFits, setPhotoFits] = useState<Record<PhotoField, PhotoFit>>({ photo_url: DEFAULT_FIT, back_photo_url: DEFAULT_FIT, detail_photo_url: DEFAULT_FIT });
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState('');
  const [productName, setProductName] = useState(piece?.name ?? '');
  const [color, setColor] = useState(piece?.color ?? '');
  const title = isEdit ? 'Editar Produto' : 'Novo Produto';

  async function handleFile(file: File) {
    const field = activeFieldRef.current;
    const fit = DEFAULT_FIT;
    setUploadState('uploading');
    setUploadError('');

    const res = await fetch('/api/upload', { method: 'POST', body: fitFormData(file, fit) });
    const data = await res.json();

    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao fazer upload.');
      return;
    }

    setPhotoFiles((current) => ({ ...current, [field]: file }));
    setPhotoFits((current) => ({ ...current, [field]: fit }));
    setPhotos((current) => ({ ...current, [field]: data.url }));
    setUploadState('done');
  }

  async function applyFit(field: PhotoField) {
    const file = photoFiles[field];
    if (!file) return;
    setUploadState('uploading');
    setUploadError('');

    const res = await fetch('/api/upload', { method: 'POST', body: fitFormData(file, photoFits[field]) });
    const data = await res.json();

    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao aplicar enquadramento.');
      return;
    }

    setPhotos((current) => ({ ...current, [field]: data.url }));
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
    setPhotoFiles((current) => ({ ...current, [field]: null }));
    setUploadState('done');
  }

  function chooseFile(field: PhotoField) {
    activeFieldRef.current = field;
    fileInputRef.current?.click();
  }

  return (
    <>
      <AppBar title={title} back onBack={() => router.back()} />
      <Topbar eyebrow="Produtos" title={title} />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <div className="mx-auto max-w-3xl">
          <form action={formAction} className="space-y-4">
            {isEdit && <input type="hidden" name="piece_id" value={piece?.id ?? ''} />}
            <input type="hidden" name="photo_url" value={photos.photo_url} />
            <input type="hidden" name="back_photo_url" value={photos.back_photo_url} />
            <input type="hidden" name="detail_photo_url" value={photos.detail_photo_url} />

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Fotos</p>
              <div className="grid gap-3 md:grid-cols-3">
                <PhotoUploader
                  title="Principal"
                  value={photos.photo_url}
                  state={uploadState}
                  fit={photoFits.photo_url}
                  canApplyFit={Boolean(photoFiles.photo_url)}
                  onFitChange={(fit) => setPhotoFits((c) => ({ ...c, photo_url: fit }))}
                  onApplyFit={() => applyFit('photo_url')}
                  onChoose={() => chooseFile('photo_url')}
                  onEnhance={() => handleEnhance('photo_url')}
                  onRemove={() => {
                    setPhotos((c) => ({ ...c, photo_url: '' }));
                    setPhotoFiles((c) => ({ ...c, photo_url: null }));
                    setPhotoFits((c) => ({ ...c, photo_url: DEFAULT_FIT }));
                  }}
                />
                <PhotoUploader
                  title="Traseira"
                  value={photos.back_photo_url}
                  state={uploadState}
                  fit={photoFits.back_photo_url}
                  canApplyFit={Boolean(photoFiles.back_photo_url)}
                  onFitChange={(fit) => setPhotoFits((c) => ({ ...c, back_photo_url: fit }))}
                  onApplyFit={() => applyFit('back_photo_url')}
                  onChoose={() => chooseFile('back_photo_url')}
                  onEnhance={() => handleEnhance('back_photo_url')}
                  onRemove={() => {
                    setPhotos((c) => ({ ...c, back_photo_url: '' }));
                    setPhotoFiles((c) => ({ ...c, back_photo_url: null }));
                    setPhotoFits((c) => ({ ...c, back_photo_url: DEFAULT_FIT }));
                  }}
                />
                <PhotoUploader
                  title="Detalhe"
                  value={photos.detail_photo_url}
                  state={uploadState}
                  fit={photoFits.detail_photo_url}
                  canApplyFit={Boolean(photoFiles.detail_photo_url)}
                  onFitChange={(fit) => setPhotoFits((c) => ({ ...c, detail_photo_url: fit }))}
                  onApplyFit={() => applyFit('detail_photo_url')}
                  onChoose={() => chooseFile('detail_photo_url')}
                  onEnhance={() => handleEnhance('detail_photo_url')}
                  onRemove={() => {
                    setPhotos((c) => ({ ...c, detail_photo_url: '' }));
                    setPhotoFiles((c) => ({ ...c, detail_photo_url: null }));
                    setPhotoFits((c) => ({ ...c, detail_photo_url: DEFAULT_FIT }));
                  }}
                />
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
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Identificação</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="name" label="Nome do produto *" placeholder="Ex: Vestido Lis" required value={productName} onChange={(e) => setProductName(e.target.value)} />
                <Select name="collection_id" label="Coleção" defaultValue={piece?.collectionId ?? ''}>
                  <option value="">Sem coleção</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </Select>
                <Select name="category" label="Categoria" defaultValue={piece?.category ?? ''}>
                  <option value="">Selecione</option>
                  {workflowConfig.product_categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__outro__">Outro…</option>
                </Select>
                <Select name="fabric" label="Tecido" defaultValue={piece?.fabric ?? ''}>
                  <option value="">Selecione</option>
                  {workflowConfig.product_fabrics.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="__outro__">Outro…</option>
                </Select>
                <Select name="color" label="Cor" value={color} onChange={(e) => setColor(e.target.value)}>
                  <option value="">Selecione</option>
                  {workflowConfig.product_colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__outro__">Outro…</option>
                </Select>
              </div>
              <Textarea className="mt-3" name="description" label="Descrição" placeholder="Descrição da peça, acabamento, bordado, coleção..." defaultValue={piece?.description ?? ''} />
            </Card>

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Preço</p>
              <div className="grid gap-3 md:grid-cols-2">
                <MoneyInput name="cost_price" label="Custo" placeholder="R$ 0,00" defaultValue={piece?.costPrice ?? ''} />
                <MoneyInput name="sale_price" label="Preço venda" placeholder="R$ 0,00" defaultValue={piece?.price ?? ''} />
              </div>
            </Card>

            <Card pad={20}>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Loja online</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex min-h-12 items-center gap-3 rounded-[12px] border border-line bg-paper px-4 text-[13px] text-ink">
                  <input name="published" type="checkbox" defaultChecked={Boolean(piece?.published)} className="h-4 w-4 accent-primary" />
                  Publicado na loja
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-[12px] border border-line bg-paper px-4 text-[13px] text-ink">
                  <input name="featured" type="checkbox" defaultChecked={Boolean(piece?.featured)} className="h-4 w-4 accent-primary" />
                  Destaque
                </label>
              </div>
            </Card>

            {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>Voltar</Button>
              <Button type="submit" block disabled={pending || uploadState === 'uploading' || uploadState === 'enhancing'}>
                {pending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Salvar produto'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function PhotoUploader({
  title, value, state, fit, canApplyFit, onFitChange, onApplyFit, onChoose, onEnhance, onRemove,
}: {
  title: string;
  value: string;
  state: UploadState;
  fit: PhotoFit;
  canApplyFit: boolean;
  onFitChange: (fit: PhotoFit) => void;
  onApplyFit: () => void;
  onChoose: () => void;
  onEnhance: () => void;
  onRemove: () => void;
}) {
  const isBusy = state === 'uploading' || state === 'enhancing';
  const previewTransform = `translate(${fit.offsetX / 3}%, ${fit.offsetY / 3}%) scale(${fit.zoom})`;

  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wide-2 text-ink-soft">{title}</p>
      {value ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] border border-line">
            <Image src={value} alt={`Foto ${title}`} width={240} height={300} className="h-full w-full object-cover object-center transition-transform duration-200" style={{ transform: previewTransform }} />
            <button type="button" onClick={onRemove} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft" aria-label="Remover foto">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 rounded-[12px] border border-line bg-surface p-3">
            <PhotoSlider icon={<Maximize2 size={12} />} label="Zoom" value={fit.zoom} min={0.2} max={2.2} step={0.02} onChange={(zoom) => onFitChange({ ...fit, zoom })} />
            <PhotoSlider icon={<MoveVertical size={12} />} label="Vertical" value={fit.offsetY} min={-100} max={100} step={1} onChange={(offsetY) => onFitChange({ ...fit, offsetY })} />
            <PhotoSlider icon={<MoveHorizontal size={12} />} label="Horizontal" value={fit.offsetX} min={-100} max={100} step={1} onChange={(offsetX) => onFitChange({ ...fit, offsetX })} />
            <div className="grid grid-cols-2 gap-2">
              <PhotoActionButton icon={<RotateCcw size={13} />} label="Centro" title="Centralizar foto" onClick={() => onFitChange({ zoom: 1, offsetX: 0, offsetY: 0 })} />
              <PhotoActionButton icon={<Check size={13} />} label={state === 'uploading' ? '...' : 'Aplicar'} title="Aplicar enquadramento" tone="soft" onClick={onApplyFit} disabled={!canApplyFit || isBusy} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PhotoActionButton icon={<Upload size={13} />} label="Trocar" title="Trocar foto" onClick={onChoose} />
            <PhotoActionButton icon={<Sparkles size={13} />} label={state === 'enhancing' ? '...' : 'IA'} title="Regenerar imagem com IA" tone="soft" onClick={onEnhance} disabled={isBusy} />
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

function PhotoActionButton({ icon, label, title, tone = 'ghost', disabled, onClick }: {
  icon: ReactNode; label: string; title: string; tone?: 'ghost' | 'soft'; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[10px] font-medium uppercase tracking-wide-1 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'soft'
          ? 'border-transparent bg-primary-soft text-primary hover:bg-primary/15'
          : 'border-line bg-transparent text-ink hover:bg-ink/[0.05]',
      ].join(' ')}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate whitespace-nowrap">{label}</span>
    </button>
  );
}

function PhotoSlider({ icon, label, value, min, max, step, onChange }: {
  icon: ReactNode; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] text-ink-soft">
      <span className="flex items-center justify-between gap-2 uppercase tracking-wide-2">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span>{label === 'Zoom' ? value.toFixed(2) : Math.round(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </label>
  );
}
