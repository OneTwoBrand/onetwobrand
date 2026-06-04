'use client';

import { useActionState, useRef, useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { saveHeroConfig, saveStoreSettings, type ShopConfigState } from './shop-config-actions';

// ─── Hero Form ────────────────────────────────────────────────────────────────
export function HeroConfigForm({ config }: { config: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveHeroConfig, {} as ShopConfigState);
  const [imageUrl, setImageUrl] = useState(config.shop_hero_image_url ?? '');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadState('uploading');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload-hero', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setUploadState('error');
      setUploadError(data.error ?? 'Erro ao enviar imagem.');
      return;
    }
    setImageUrl(data.url);
    setUploadState('idle');
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shop_hero_image_url" value={imageUrl} />

      {/* Photo uploader */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">Foto do hero (16:9)</p>
        {imageUrl ? (
          <div className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-[14px] border border-line">
              <Image src={imageUrl} alt="Hero da vitrine" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
                aria-label="Remover foto do hero"
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
            {uploadState === 'uploading' ? (
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Upload size={22} />
            )}
            <span className="text-[11px]">
              {uploadState === 'uploading' ? 'Enviando…' : 'Clique para selecionar a foto'}
            </span>
            <span className="text-[10px] text-ink-mute">JPG, PNG, HEIC ou WebP · máx. 30 MB · convertido para WebP 1920×1080</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp"
          aria-label="Selecionar foto do hero"
          title="Selecionar foto do hero"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {uploadError && <p className="mt-1 text-[12px] text-danger">{uploadError}</p>}
      </div>

      {/* Text fields */}
      <Input
        name="shop_hero_eyebrow"
        label="Eyebrow (texto pequeno acima)"
        defaultValue={config.shop_hero_eyebrow}
        placeholder="Nova coleção"
      />
      <Input
        name="shop_hero_title"
        label="Título principal *"
        defaultValue={config.shop_hero_title}
        placeholder="PRIMAVERA 2026"
        required
      />
      <Input
        name="shop_hero_cta_label"
        label="Texto do botão"
        defaultValue={config.shop_hero_cta_label}
        placeholder="Ver coleção"
      />
      <Input
        name="shop_hero_cta_href"
        label="Link do botão"
        defaultValue={config.shop_hero_cta_href}
        placeholder="/loja/colecoes/ss26"
      />

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending || uploadState === 'uploading'} block>
        {pending ? 'Salvando…' : 'Salvar hero'}
      </Button>
    </form>
  );
}

// ─── Store Settings Form ──────────────────────────────────────────────────────
export function StoreSettingsForm({ config }: { config: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveStoreSettings, {} as ShopConfigState);

  return (
    <form action={action} className="space-y-6">

      <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Frete e entrega</legend>
        <Input
          name="shop_free_shipping_above"
          label="Frete grátis acima de (R$)"
          defaultValue={config.shop_free_shipping_above}
          placeholder="399"
          type="number"
          step="0.01"
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
      </fieldset>

      <fieldset className="space-y-4">
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
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">Comunicação</legend>
        <Input
          name="shop_whatsapp"
          label="WhatsApp de atendimento"
          defaultValue={config.shop_whatsapp}
          placeholder="(11) 99999-9999"
          type="tel"
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
      </fieldset>

      <fieldset className="space-y-4">
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
      </fieldset>

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
