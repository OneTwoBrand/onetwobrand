'use client';

import { useActionState, useRef, useState, type ReactNode } from 'react';
import { Check, Maximize2, MoveHorizontal, MoveVertical, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput, PhoneInput } from '@/components/ui/MaskedInput';
import { Select, Textarea } from '@/components/ui/Field';
import { parseShopVisualConfig } from '@/lib/shop/visual-config';
import { saveHeroConfig, saveStoreSettings, saveVisualSettings, saveCanaisSettings, type ShopConfigState } from './shop-config-actions';

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

function SlideSlider({ icon, label, value, min, max, step, onChange }: {
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

function SlideActionButton({ icon, label, title, tone = 'ghost', disabled, onClick }: {
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

// ─── Single slide uploader + controls ────────────────────────────────────────
function SlotUploader({
  slot,
  imageUrl,
  onImageUrl,
}: {
  slot: 1 | 2 | 3;
  imageUrl: string;
  onImageUrl: (url: string) => void;
}) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState('');
  const [fit, setFit] = useState<HeroFit>(DEFAULT_FIT);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = uploadState === 'uploading' || uploadState === 'enhancing';
  const previewTransform = `translate(${fit.offsetX / 4}%, ${fit.offsetY / 4}%) scale(${fit.zoom})`;

  async function handleFile(file: File) {
    setUploadState('uploading');
    setUploadError('');
    const currentFit = DEFAULT_FIT;
    setFit(currentFit);
    const res = await fetch('/api/upload-hero', { method: 'POST', body: fitFormData(file, currentFit) });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao enviar imagem.');
      return;
    }
    setCurrentFile(file);
    onImageUrl(data.url);
    setUploadState('done');
  }

  async function applyFit() {
    if (!currentFile) return;
    setUploadState('uploading');
    setUploadError('');
    const res = await fetch('/api/upload-hero', { method: 'POST', body: fitFormData(currentFile, fit) });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao aplicar enquadramento.');
      return;
    }
    onImageUrl(data.url);
    setUploadState('done');
  }

  async function handleEnhance() {
    if (!imageUrl) return;
    setUploadState('enhancing');
    setUploadError('');
    const res = await fetch('/api/ai/enhance-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, productName: `Slide ${slot}` }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao refinar imagem.');
      return;
    }
    onImageUrl(data.url);
    setCurrentFile(null);
    setUploadState('done');
  }

  function handleRemove() {
    onImageUrl('');
    setCurrentFile(null);
    setFit(DEFAULT_FIT);
    setUploadState('idle');
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
        Foto (16:9 · WebP 1920×1080)
      </p>
      {imageUrl ? (
        <div className="space-y-2">
          <div className="relative aspect-video overflow-hidden rounded-[12px] border border-line">
            <Image
              src={imageUrl}
              alt={`Slide ${slot}`}
              fill
              className="object-cover object-center transition-transform duration-200"
              style={{ transform: previewTransform }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
              aria-label="Remover foto"
            >
              <X size={14} />
            </button>
          </div>

          {/* Controles de enquadramento */}
          <div className="space-y-2 rounded-[12px] border border-line bg-surface p-3">
            <SlideSlider icon={<Maximize2 size={12} />} label="Zoom" value={fit.zoom} min={0.2} max={2.2} step={0.02} onChange={(zoom) => setFit((f) => ({ ...f, zoom }))} />
            <SlideSlider icon={<MoveVertical size={12} />} label="Vertical" value={fit.offsetY} min={-100} max={100} step={1} onChange={(offsetY) => setFit((f) => ({ ...f, offsetY }))} />
            <SlideSlider icon={<MoveHorizontal size={12} />} label="Horizontal" value={fit.offsetX} min={-100} max={100} step={1} onChange={(offsetX) => setFit((f) => ({ ...f, offsetX }))} />
            <div className="grid grid-cols-2 gap-2">
              <SlideActionButton icon={<RotateCcw size={13} />} label="Centro" title="Centralizar foto" onClick={() => setFit(DEFAULT_FIT)} />
              <SlideActionButton icon={<Check size={13} />} label={uploadState === 'uploading' ? '...' : 'Aplicar'} title="Aplicar enquadramento" tone="soft" onClick={applyFit} disabled={!currentFile || isBusy} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SlideActionButton icon={<Upload size={13} />} label="Trocar foto" title="Trocar foto do slide" onClick={() => fileInputRef.current?.click()} />
            <SlideActionButton icon={<Sparkles size={13} />} label={uploadState === 'enhancing' ? '...' : 'Gerar com IA'} title="Refinar imagem com IA" tone="soft" onClick={handleEnhance} disabled={isBusy} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-line bg-surface text-ink-soft hover:border-primary hover:text-primary transition-colors"
        >
          {uploadState === 'uploading'
            ? <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            : <Upload size={20} />
          }
          <span className="text-[11px]">
            {uploadState === 'uploading' ? 'Enviando…' : 'Clique para selecionar'}
          </span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp"
        aria-label={`Foto do slide ${slot}`}
        title={`Foto do slide ${slot}`}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      {uploadError && <p className="mt-1 text-[11px] text-danger">{uploadError}</p>}
    </div>
  );
}

// ─── Hero Form ────────────────────────────────────────────────────────────────
export function HeroConfigForm({ config }: { config: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveHeroConfig, {} as ShopConfigState);

  const [images, setImages] = useState({
    1: config['shop_hero_1_image_url'] ?? '',
    2: config['shop_hero_2_image_url'] ?? '',
    3: config['shop_hero_3_image_url'] ?? '',
  });

  const slots = [1, 2, 3] as const;

  return (
    <form action={action} className="space-y-6">
      {/* Hidden image URL fields */}
      {slots.map((n) => (
        <input key={n} type="hidden" name={`shop_hero_${n}_image_url`} value={images[n]} />
      ))}

      {/* Interval */}
      <div className="flex items-center gap-3">
        <div className="w-28">
          <Input
            name="shop_hero_interval"
            label="Intervalo (s)"
            type="number"
            min="3"
            max="30"
            step="1"
            defaultValue={config['shop_hero_interval'] || '7'}
          />
        </div>
        <p className="text-[11px] text-ink-soft mt-4 leading-[1.5]">
          Segundos entre cada slide.<br />Mín. 3 s · Máx. 30 s.
        </p>
      </div>

      {/* 3 slots */}
      {slots.map((n) => (
        <div key={n} className="rounded-[14px] border border-line p-4 space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
            Slide {n}{n === 1 ? ' · obrigatório' : ' · opcional'}
          </p>

          <SlotUploader
            slot={n}
            imageUrl={images[n]}
            onImageUrl={(url) => setImages((prev) => ({ ...prev, [n]: url }))}
          />

          <Input
            name={`shop_hero_${n}_eyebrow`}
            label="Eyebrow"
            defaultValue={config[`shop_hero_${n}_eyebrow`]}
            placeholder="Nova coleção"
          />
          <Input
            name={`shop_hero_${n}_title`}
            label={`Título${n === 1 ? ' *' : ''}`}
            defaultValue={config[`shop_hero_${n}_title`]}
            placeholder="PRIMAVERA 2026"
            required={n === 1}
          />
          <Input
            name={`shop_hero_${n}_cta_label`}
            label="Texto do botão"
            defaultValue={config[`shop_hero_${n}_cta_label`]}
            placeholder="Ver coleção"
          />
          <Input
            name={`shop_hero_${n}_cta_href`}
            label="Link do botão"
            defaultValue={config[`shop_hero_${n}_cta_href`]}
            placeholder="/loja/colecoes/ss26"
          />
        </div>
      ))}

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar slides'}
      </Button>
    </form>
  );
}

// ─── Store Settings Form ──────────────────────────────────────────────────────
type StoreSection = 'all' | 'frete' | 'comunicacao' | 'seo';

export function StoreSettingsForm({
  config,
  section = 'all',
}: {
  config: Record<string, string>;
  section?: StoreSection;
}) {
  const [state, action, pending] = useActionState(saveStoreSettings, {} as ShopConfigState);
  const show = (s: StoreSection) => section === 'all' || section === s;

  return (
    <form action={action} className="space-y-6">

      {show('frete') && <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Frete e entrega</legend>
        <MoneyInput
          name="shop_free_shipping_above"
          label="Frete grátis acima de (R$)"
          defaultValue={config.shop_free_shipping_above}
          placeholder="R$ 399,00"
        />
        <Input
          name="shop_production_lead_time"
          label="Prazo de produção"
          defaultValue={config.shop_production_lead_time}
          placeholder="5 a 10 dias úteis"
        />
        <Textarea
          name="shop_delivery_message"
          label="Mensagem de entrega (exibida na página do produto)"
          defaultValue={config.shop_delivery_message}
          placeholder="Peça artesanal sob encomenda. Prazo de produção: 5 a 10 dias úteis."
        />
      </fieldset>}

      {show('frete') && <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Catálogo</legend>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="shop_show_out_of_stock"
            name="shop_show_out_of_stock"
            value="true"
            defaultChecked={config.shop_show_out_of_stock === 'true'}
            className="h-4 w-4 rounded border-line accent-primary"
          />
          <label htmlFor="shop_show_out_of_stock" className="text-[13px] text-ink">
            Exibir produtos esgotados na vitrine
          </label>
        </div>
      </fieldset>}

      {show('comunicacao') && <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Comunicação</legend>
        <PhoneInput
          name="shop_whatsapp"
          label="WhatsApp de atendimento"
          defaultValue={config.shop_whatsapp}
          placeholder="(67) 9 0000-0000"
        />
        <Input
          name="shop_instagram"
          label="Instagram"
          defaultValue={config.shop_instagram}
          placeholder="@onetwobrand"
        />
        <Input
          name="shop_reply_to_email"
          label="E-mail de resposta (reply-to)"
          defaultValue={config.shop_reply_to_email}
          placeholder="atelier@one2brand.com.br"
          type="email"
        />
        <Textarea
          name="shop_order_confirmation_msg"
          label="Mensagem na confirmação de pedido"
          defaultValue={config.shop_order_confirmation_msg}
          placeholder="Obrigada pela sua confiança! Em breve entraremos em contato."
        />
        <Input
          name="shop_announcement_bar"
          label="Barra de anúncio (topo da loja)"
          defaultValue={config.shop_announcement_bar}
          placeholder="Use BEMVINDA10 e ganhe 10% off no primeiro pedido"
        />
      </fieldset>}

      {show('seo') && <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">SEO</legend>
        <Input
          name="shop_meta_title"
          label="Título da loja (meta title)"
          defaultValue={config.shop_meta_title}
          placeholder="ONE TWO · crafted pieces"
        />
        <Textarea
          name="shop_meta_description"
          label="Descrição (meta description)"
          defaultValue={config.shop_meta_description}
          placeholder="Peças artesanais feitas em pequenas tiragens pelo atelier ONE TWO."
        />
      </fieldset>}

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </form>
  );
}

export function VisualEffectsForm({ config }: { config: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveVisualSettings, {} as ShopConfigState);
  const visual = parseShopVisualConfig(config);

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
          Movimento editorial
        </legend>
        <Select name="shop_visual_hero_motion" label="Efeito do hero" defaultValue={visual.heroMotion}>
          <option value="soft">Zoom suave</option>
          <option value="editorial">Editorial amplo</option>
          <option value="none">Sem movimento</option>
        </Select>
        <p className="text-[11px] leading-relaxed text-ink-soft">
          O efeito é desativado automaticamente para visitantes que preferem reduzir animações no sistema.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
          Home da loja
        </legend>
        <VisualToggle
          name="shop_visual_spotlight_autoplay"
          checked={visual.spotlightAutoplay}
          label="Alternar coleções em destaque automaticamente"
        />
        <VisualToggle
          name="shop_visual_collection_card_motion"
          checked={visual.collectionCardMotion}
          label="Aplicar zoom sutil nos cards de coleção"
        />
        <VisualToggle
          name="shop_visual_product_card_motion"
          checked={visual.productCardMotion}
          label="Aplicar zoom sutil nas fotos de produto"
        />
        <VisualToggle
          name="shop_visual_section_reveal"
          checked={visual.sectionReveal}
          label="Revelar seções com fade suave"
        />
      </fieldset>

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar efeitos visuais'}
      </Button>
    </form>
  );
}

export function CanaisForm({ config }: { config: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveCanaisSettings, {} as ShopConfigState);

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
          Sacola de compras
        </legend>
        <VisualToggle
          name="shop_enable_cart"
          checked={config['shop_enable_cart'] === 'true'}
          label="Habilitar sacola / carrinho de compras"
        />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Quando ativada, a cliente pode adicionar peças e finalizar o pedido online com pagamento por cartão, PIX ou boleto.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
          Negociação pelo WhatsApp
        </legend>
        <VisualToggle
          name="shop_enable_whatsapp_button"
          checked={config['shop_enable_whatsapp_button'] === 'true'}
          label="Habilitar negociação pelo WhatsApp no checkout"
        />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Quando ativado, a etapa de pagamento exibe um botão que abre o WhatsApp da loja com a sacola completa — itens, tamanhos e total — para a cliente negociar diretamente com a vendedora. O número configurado em <strong>Comunicação</strong> é usado como destino.
        </p>
      </fieldset>

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar canais'}
      </Button>
    </form>
  );
}

function VisualToggle({
  name,
  checked,
  label,
}: {
  name: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-[12px] border border-line bg-paper px-4 text-[13px] text-ink">
      <input
        name={name}
        type="checkbox"
        defaultChecked={checked}
        className="h-4 w-4 shrink-0 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}
