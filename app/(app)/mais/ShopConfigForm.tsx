'use client';

import { useActionState, useRef, useState, type ReactNode } from 'react';
import { Check, Maximize2, MoveHorizontal, MoveVertical, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput, PhoneInput } from '@/components/ui/MaskedInput';
import { Select, Textarea } from '@/components/ui/Field';
import { parseShopVisualConfig } from '@/lib/shop/visual-config';
import { saveHeroConfig, saveStoreSettings, saveVisualSettings, saveCanaisSettings, savePagesSettings, type ShopConfigState } from './shop-config-actions';

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
  const isWa = config['shop_enable_whatsapp_button'] === 'true';
  const [canal, setCanal] = useState<'pagamento' | 'whatsapp'>(isWa ? 'whatsapp' : 'pagamento');

  return (
    <form action={action} className="space-y-5">
      <p className="text-[11px] text-ink-soft leading-relaxed">
        Escolha como as clientes finalizam a compra. A sacola está sempre disponível — o canal define o que acontece no checkout.
      </p>

      {/* Opção: Pagamento online */}
      <label className={`flex gap-3 items-start p-4 rounded-[14px] border cursor-pointer transition-colors ${canal === 'pagamento' ? 'border-primary bg-primary-soft' : 'border-line bg-paper hover:border-ink/30'}`}>
        <input
          type="radio"
          name="canal_venda"
          value="pagamento"
          checked={canal === 'pagamento'}
          onChange={() => setCanal('pagamento')}
          className="mt-0.5 accent-primary shrink-0"
        />
        <div>
          <p className="text-[13px] font-medium text-ink">Pagamento online</p>
          <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
            A cliente finaliza o pedido com cartão de crédito, PIX ou boleto — processado pela Stripe / MercadoPago.
          </p>
        </div>
      </label>

      {/* Opção: Negociação WhatsApp */}
      <label className={`flex gap-3 items-start p-4 rounded-[14px] border cursor-pointer transition-colors ${canal === 'whatsapp' ? 'border-primary bg-primary-soft' : 'border-line bg-paper hover:border-ink/30'}`}>
        <input
          type="radio"
          name="canal_venda"
          value="whatsapp"
          checked={canal === 'whatsapp'}
          onChange={() => setCanal('whatsapp')}
          className="mt-0.5 accent-primary shrink-0"
        />
        <div className="flex-1">
          <p className="text-[13px] font-medium text-ink">Negociação pelo WhatsApp</p>
          <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
            O checkout envia a sacola completa (itens, tamanhos, total) direto para o WhatsApp da loja. Ideal para vendas consultivas.
          </p>
          {canal === 'whatsapp' && (
            <div className="mt-3">
              <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft block mb-1.5">
                Número do WhatsApp
              </label>
              <PhoneInput
                name="shop_whatsapp"
                defaultValue={config['shop_whatsapp'] ?? ''}
                placeholder="(67) 9 0000-0000"
              />
            </div>
          )}
        </div>
      </label>

      {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-[12px] text-success">
          <Check size={13} /> {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar canal'}
      </Button>
    </form>
  );
}

// ─── Conteúdo padrão para fallback ───────────────────────────────────────────
const DEFAULT_PRIVACIDADE = `## Quem somos
ONE TWO é um atelier de moda artesanal que produz peças em pequenas tiragens. Esta política descreve como coletamos e usamos seus dados quando você realiza uma compra ou nos contata.

## Dados que coletamos
Coletamos apenas os dados necessários para processar seu pedido: nome completo, e-mail, telefone, endereço de entrega e dados de pagamento (processados pela Stripe ou MercadoPago — não armazenamos dados de cartão).

## Como usamos seus dados
Seus dados são usados exclusivamente para processar e entregar seu pedido, comunicar atualizações de produção e entrega, responder dúvidas e cumprir obrigações legais. **Não vendemos, alugamos ou compartilhamos seus dados** com terceiros para fins comerciais.

## Armazenamento e segurança
Seus dados são armazenados em servidores seguros (Supabase/AWS) com criptografia em trânsito (TLS) e em repouso. O acesso é restrito à equipe responsável pelo atendimento e produção.

## Cookies
Utilizamos apenas cookies estritamente necessários para o funcionamento da loja (sessão do carrinho e preferências de navegação). Não usamos cookies de rastreamento ou publicidade de terceiros.

## Seus direitos (LGPD)
Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a confirmar a existência de tratamento dos seus dados, acessar, corrigir ou solicitar a exclusão, e revogar o consentimento a qualquer momento. Para exercer qualquer desses direitos, entre em contato pelo e-mail ou WhatsApp disponíveis no rodapé.

## Alterações nesta política
Podemos atualizar esta política periodicamente. A data de última atualização estará sempre indicada no topo desta página.`;

const DEFAULT_TROCAS = `## Peças sob encomenda
Todas as peças ONE TWO são produzidas artesanalmente sob encomenda após a confirmação do pedido. Por essa razão, **não realizamos trocas ou devoluções por arrependimento** em peças feitas sob medida ou personalizadas.

## Defeito de fabricação
Caso sua peça apresente defeito de fabricação comprovado, você tem até **7 dias corridos** após o recebimento para nos contatar. Envie fotos detalhadas do problema para o nosso WhatsApp ou e-mail. Após análise, realizaremos o conserto sem custo, a substituição da peça ou o reembolso integral.

## Prazo de envio para troca
A peça deve ser devolvida em até **14 dias corridos** após a autorização, sem sinais de uso, com etiquetas originais e na embalagem original sempre que possível. O frete de devolução é de responsabilidade do cliente, exceto nos casos de defeito comprovado.

## Como entrar em contato
Fale conosco pelo WhatsApp ou pelo e-mail listado no rodapé da loja. Informe o número do pedido, descreva o problema e anexe fotos se possível. Respondemos em até 2 dias úteis.

## Reembolso
Reembolsos aprovados são processados no mesmo meio de pagamento utilizado na compra, em até **10 dias úteis** após a confirmação da devolução. Para pagamentos via cartão de crédito, o prazo pode variar conforme a operadora.`;

const DEFAULT_FAQ: FaqItem[] = [
  { pergunta: 'As peças são feitas à mão mesmo?', resposta: 'Sim, de verdade. Cada peça passa pelas mãos das nossas costureiras antes de chegar até você. Não tem robô, não tem linha de montagem — tem gente de verdade com muito cuidado no processo.' },
  { pergunta: 'Tem estoque disponível ou é tudo sob encomenda?', resposta: 'Depende da peça! Algumas estão disponíveis imediatamente, outras são produzidas depois do seu pedido. A própria página do produto deixa claro quando é o caso.' },
  { pergunta: 'Como sei qual tamanho escolher?', resposta: 'Na página de cada produto há um guia de medidas. Se ainda ficou com dúvida, pergunte pelo WhatsApp antes de comprar — a vendedora conhece cada peça e ajuda a escolher.' },
  { pergunta: 'Quanto tempo demora para meu pedido chegar?', resposta: 'São alguns dias úteis de produção + o prazo de entrega do frete escolhido. Você pode conferir o prazo estimado direto na página do produto.' },
  { pergunta: 'Quais formas de pagamento vocês aceitam?', resposta: 'Cartão de crédito, PIX (com 5% de desconto!) e boleto bancário. Se preferir negociar direto, pode usar o WhatsApp no checkout.' },
  { pergunta: 'Posso devolver se não gostei?', resposta: 'Como as peças são feitas sob encomenda, não aceitamos devoluções por desistência. Mas se chegou com defeito de fabricação, a gente resolve — prazo de 7 dias após o recebimento.' },
  { pergunta: 'Vocês têm loja física?', resposta: 'Somos um atelier, então o atendimento é por agendamento. Se quiser visitar, fala pelo WhatsApp antes de aparecer de surpresa (a gente pode estar costurando com fone de ouvido).' },
];

export type FaqItem = { pergunta: string; resposta: string };

export function PagesForm({ config }: { config: Record<string, string> }) {
  const [activePage, setActivePage] = useState<'privacidade' | 'trocas' | 'faq'>('privacidade');
  const [state, action, pending] = useActionState(savePagesSettings, {} as ShopConfigState);

  // FAQ state
  const parsedFaq: FaqItem[] = (() => {
    try { return JSON.parse(config['shop_faq'] || '[]'); } catch { return []; }
  })();
  const [faqItems, setFaqItems] = useState<FaqItem[]>(parsedFaq.length ? parsedFaq : DEFAULT_FAQ);

  function addItem() { setFaqItems((prev) => [...prev, { pergunta: '', resposta: '' }]); }
  function removeItem(i: number) { setFaqItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: 'pergunta' | 'resposta', value: string) {
    setFaqItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  const tabs: Array<{ id: 'privacidade' | 'trocas' | 'faq'; label: string; key: string; defaultContent: string; hint: string }> = [
    { id: 'privacidade', label: 'Privacidade', key: 'shop_page_privacidade', defaultContent: DEFAULT_PRIVACIDADE, hint: 'Política de privacidade e LGPD' },
    { id: 'trocas',      label: 'Trocas',      key: 'shop_page_trocas',      defaultContent: DEFAULT_TROCAS,      hint: 'Política de trocas e devoluções' },
    { id: 'faq',         label: 'FAQ',          key: 'shop_faq',              defaultContent: '',                  hint: 'Perguntas frequentes' },
  ];
  const current = tabs.find((t) => t.id === activePage)!;

  return (
    <div className="space-y-5">
      {/* Subtabs */}
      <div className="flex gap-1 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePage(tab.id)}
            className={[
              'shrink-0 px-3 py-2 text-[11px] font-medium tracking-wide-1 uppercase transition-colors border-b-2 -mb-px',
              activePage === tab.id ? 'border-primary text-primary' : 'border-transparent text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-ink-soft">{current.hint}</p>

      {activePage !== 'faq' ? (
        <form action={action} className="space-y-4">
          <input type="hidden" name="page" value={activePage} />
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">
              Conteúdo — suporta **negrito**, ## Títulos, listas com -
            </p>
            <textarea
              name="content"
              rows={18}
              defaultValue={config[current.key] || current.defaultContent}
              placeholder={current.defaultContent}
              className="w-full rounded-[12px] border border-line bg-paper px-4 py-3 text-[12px] text-ink placeholder:text-ink-mute font-mono leading-relaxed resize-y focus:outline-none focus:border-primary/60"
            />
          </div>
          <p className="text-[11px] text-ink-mute leading-relaxed">
            Use <code className="bg-surface px-1 rounded">## Título</code> para seções, <code className="bg-surface px-1 rounded">**texto**</code> para negrito e <code className="bg-surface px-1 rounded">- item</code> para listas. Deixe em branco para usar o conteúdo padrão.
          </p>
          {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
          {state?.success && (
            <p className="flex items-center gap-1.5 text-[12px] text-success">
              <Check size={13} /> {state.success}
            </p>
          )}
          <Button type="submit" size="sm" disabled={pending} block>
            {pending ? 'Salvando…' : `Salvar página de ${activePage}`}
          </Button>
        </form>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="page" value="faq" />
          <input type="hidden" name="faq_json" value={JSON.stringify(faqItems)} />
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="rounded-[12px] border border-line bg-paper p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Pergunta {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-[11px] text-danger hover:underline"
                  >
                    Remover
                  </button>
                </div>
                <input
                  type="text"
                  value={item.pergunta}
                  onChange={(e) => updateItem(i, 'pergunta', e.target.value)}
                  placeholder="Ex: As peças são feitas à mão?"
                  className="w-full h-10 rounded-[10px] border border-line bg-surface px-3 text-[12px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-primary/60"
                />
                <textarea
                  value={item.resposta}
                  onChange={(e) => updateItem(i, 'resposta', e.target.value)}
                  placeholder="Resposta clara e direta..."
                  rows={3}
                  className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-ink-mute leading-relaxed resize-none focus:outline-none focus:border-primary/60"
                />
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addItem} block>
            + Adicionar pergunta
          </Button>
          {state?.error && <p className="text-[12px] text-danger">{state.error}</p>}
          {state?.success && (
            <p className="flex items-center gap-1.5 text-[12px] text-success">
              <Check size={13} /> {state.success}
            </p>
          )}
          <Button type="submit" size="sm" disabled={pending} block>
            {pending ? 'Salvando…' : 'Salvar FAQ'}
          </Button>
        </form>
      )}
    </div>
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
