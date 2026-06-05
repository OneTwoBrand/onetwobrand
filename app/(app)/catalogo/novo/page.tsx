'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState, type ReactNode } from 'react';
import {
  Check, ChevronLeft, Maximize2, MoveHorizontal,
  MoveVertical, RotateCcw, Sparkles, Upload, X,
} from 'lucide-react';
import Image from 'next/image';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { createCollection } from '../actions';

type UploadState = 'idle' | 'uploading' | 'enhancing' | 'done' | 'error';
type HeroFit = { zoom: number; offsetX: number; offsetY: number };
const DEFAULT_FIT: HeroFit = { zoom: 1, offsetX: 0, offsetY: 0 };

function fitFormData(file: File, fit: HeroFit) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('zoom', String(fit.zoom));
  fd.append('offsetX', String(fit.offsetX));
  fd.append('offsetY', String(fit.offsetY));
  return fd;
}

export default function NovaColecaoPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCollection, {});

  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [fit, setFit] = useState<HeroFit>(DEFAULT_FIT);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadErr, setUploadErr] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = uploadState === 'uploading' || uploadState === 'enhancing';

  async function handleFile(file: File) {
    setUploadState('uploading');
    setUploadErr('');
    const currentFit = DEFAULT_FIT;
    setFit(currentFit);

    const res = await fetch('/api/upload-hero', { method: 'POST', body: fitFormData(file, currentFit) });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadErr(data.error ?? 'Erro ao enviar imagem.');
      return;
    }
    setCoverFile(file);
    setCoverUrl(data.url);
    setUploadState('done');
  }

  async function applyFit() {
    if (!coverFile) return;
    setUploadState('uploading');
    setUploadErr('');
    const res = await fetch('/api/upload-hero', { method: 'POST', body: fitFormData(coverFile, fit) });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadErr(data.error ?? 'Erro ao aplicar enquadramento.');
      return;
    }
    setCoverUrl(data.url);
    setUploadState('done');
  }

  async function handleEnhance() {
    if (!coverUrl) return;
    setUploadState('enhancing');
    setUploadErr('');
    const res = await fetch('/api/ai/enhance-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: coverUrl, productName: collectionName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadErr(data.error ?? 'Erro ao refinar imagem.');
      return;
    }
    setCoverUrl(data.url);
    setCoverFile(null);
    setUploadState('done');
  }

  const previewTransform = `translate(${fit.offsetX / 4}%, ${fit.offsetY / 4}%) scale(${fit.zoom})`;

  return (
    <>
      <AppBar title="Nova coleção" back onBack={() => router.back()} />
      <Topbar eyebrow="Coleções" title="Nova coleção" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="cover_url" value={coverUrl} />

          {/* ── Foto de capa ─────────────────────────────── */}
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
              Foto de capa
            </p>

            {coverUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-video overflow-hidden rounded-[14px] border border-line">
                  <Image
                    src={coverUrl}
                    alt="Capa da coleção"
                    fill
                    className="object-cover object-center transition-transform duration-200"
                    style={{ transform: previewTransform }}
                  />
                  <button
                    type="button"
                    onClick={() => { setCoverUrl(''); setCoverFile(null); setFit(DEFAULT_FIT); }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
                    aria-label="Remover foto"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Controles de enquadramento */}
                <div className="space-y-2 rounded-[12px] border border-line bg-surface p-3">
                  <HeroSlider icon={<Maximize2 size={12} />} label="Zoom" value={fit.zoom} min={0.2} max={2.2} step={0.02} onChange={(zoom) => setFit((f) => ({ ...f, zoom }))} />
                  <HeroSlider icon={<MoveVertical size={12} />} label="Vertical" value={fit.offsetY} min={-100} max={100} step={1} onChange={(offsetY) => setFit((f) => ({ ...f, offsetY }))} />
                  <HeroSlider icon={<MoveHorizontal size={12} />} label="Horizontal" value={fit.offsetX} min={-100} max={100} step={1} onChange={(offsetX) => setFit((f) => ({ ...f, offsetX }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <HeroActionButton icon={<RotateCcw size={13} />} label="Centro" title="Centralizar foto" onClick={() => setFit(DEFAULT_FIT)} />
                    <HeroActionButton icon={<Check size={13} />} label={uploadState === 'uploading' ? '...' : 'Aplicar'} title="Aplicar enquadramento" tone="soft" onClick={applyFit} disabled={!coverFile || isBusy} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <HeroActionButton icon={<Upload size={13} />} label="Trocar foto" title="Trocar foto de capa" onClick={() => fileInputRef.current?.click()} />
                  <HeroActionButton icon={<Sparkles size={13} />} label={uploadState === 'enhancing' ? '...' : 'Gerar com IA'} title="Refinar imagem com IA" tone="soft" onClick={handleEnhance} disabled={isBusy} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line bg-surface text-ink-soft hover:border-primary hover:text-primary transition-colors"
              >
                {uploadState === 'uploading'
                  ? <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : <Upload size={20} />
                }
                <span className="text-[11px]">{uploadState === 'uploading' ? 'Enviando…' : 'Clique para selecionar'}</span>
                <span className="text-[10px] text-ink-mute">JPG, PNG, HEIC ou WebP · 1920×1080px WebP</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp"
              aria-label="Selecionar foto de capa"
              title="Selecionar foto de capa"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            {uploadErr && <p className="mt-2 text-[12px] text-danger">{uploadErr}</p>}
          </Card>

          {/* ── Dados ────────────────────────────────────── */}
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Coleção</p>
            <div className="space-y-3">
              <Input name="name" label="Nome *" placeholder="Ex: Verão 2026" required value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
              <Input name="category" label="Categoria" placeholder="Premium, Bordados, Casual..." />
              <Textarea name="description" label="Descrição" placeholder="Resumo criativo e operacional da coleção." />
            </div>
          </Card>

          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Loja</p>
            <div className="grid gap-3 md:grid-cols-[1fr_140px]">
              <label className="flex min-h-12 items-center gap-3 rounded-[12px] border border-line bg-paper px-4 text-[13px] text-ink">
                <input name="featured" type="checkbox" className="h-4 w-4 accent-primary" />
                Destacar na home da loja
              </label>
              <Input name="featured_order" label="Ordem" type="number" min="0" defaultValue="0" />
            </div>
          </Card>

          {state?.error && <p className="text-[12px] font-medium text-danger">{state.error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} icon={<ChevronLeft size={14} />}>
              Voltar
            </Button>
            <Button type="submit" block disabled={pending || isBusy}>
              {pending ? 'Salvando...' : 'Salvar coleção'}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

// ── Slider ────────────────────────────────────────────────────
function HeroSlider({ icon, label, value, min, max, step, onChange }: {
  icon: ReactNode; label: string; value: number;
  min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] text-ink-soft">
      <span className="flex items-center justify-between gap-2 uppercase tracking-[0.14em]">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span>{label === 'Zoom' ? value.toFixed(2) : Math.round(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </label>
  );
}

// ── Botão de ação compacto ────────────────────────────────────
function HeroActionButton({ icon, label, title, tone = 'ghost', disabled, onClick }: {
  icon: ReactNode; label: string; title: string;
  tone?: 'ghost' | 'soft'; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
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
