'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState } from 'react';
import { ChevronLeft, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Primitives';
import { createCollection } from '../actions';

export default function NovaColecaoPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCollection, {});

  const [coverUrl, setCoverUrl]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadErr('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload-hero', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setUploadErr(data.error ?? 'Erro ao enviar imagem.');
      setUploading(false);
      return;
    }
    setCoverUrl(data.url);
    setUploading(false);
  }

  return (
    <>
      <AppBar title="Nova coleção" back onBack={() => router.back()} />
      <Topbar eyebrow="Coleções" title="Nova coleção" />
      <main className="flex-1 px-5 pb-28 pt-4 md:px-9 md:py-8">
        <form action={formAction} className="mx-auto max-w-xl space-y-4">
          <input type="hidden" name="cover_url" value={coverUrl} />

          {/* Foto de capa */}
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
              Foto de capa
            </p>
            {coverUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-video overflow-hidden rounded-[14px] border border-line">
                  <Image src={coverUrl} alt="Capa da coleção" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
                    aria-label="Remover foto"
                  >
                    <X size={14} />
                  </button>
                </div>
                <Button type="button" size="sm" variant="ghost" block onClick={() => fileInputRef.current?.click()}>
                  Trocar foto
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line bg-surface text-ink-soft hover:border-primary hover:text-primary transition-colors"
              >
                {uploading
                  ? <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : <Upload size={20} />
                }
                <span className="text-[11px]">
                  {uploading ? 'Enviando…' : 'Clique para selecionar'}
                </span>
                <span className="text-[10px] text-ink-mute">JPG, PNG, HEIC ou WebP · convertido para WebP 1920×1080</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp"
              aria-label="Selecionar foto de capa"
              title="Selecionar foto de capa"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {uploadErr && <p className="mt-2 text-[12px] text-danger">{uploadErr}</p>}
          </Card>

          {/* Dados */}
          <Card pad={20}>
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Coleção</p>
            <div className="space-y-3">
              <Input name="name" label="Nome *" placeholder="Ex: Verão 2026" required />
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
            <Button type="submit" block disabled={pending || uploading}>
              {pending ? 'Salvando...' : 'Salvar coleção'}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
