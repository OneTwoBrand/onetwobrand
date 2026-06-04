/**
 * ONE TWO · /checkout — Identificação + Entrega
 * Passo 1 (identificação) + Passo 2 (endereço + frete).
 * Mobile-first: formulário empilhado, seleção de frete como radio list.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useCartStore } from '@/lib/shop/cart-store';
import { lookupCep, formatCep, getShippingOptions } from '@/lib/shop/shipping';
import { brl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckoutStepper } from './CheckoutStepper';

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Concluir'];

type CustomerInfo = { name: string; email: string; phone: string };
type AddressInfo  = {
  label: string; street: string; number: string;
  complement: string; district: string; city: string; state: string; cep: string;
};

export default function CheckoutPage() {
  const router   = useRouter();
  const { subtotal, items, itemCount } = useCartStore();
  const sub      = subtotal();
  const count    = itemCount();
  const [step, setStep]       = useState<1 | 2>(1);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', email: '', phone: '' });
  const [address, setAddress]   = useState<AddressInfo>({
    label: 'Casa', street: '', number: '', complement: '', district: '', city: '', state: '', cep: '',
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [shipping, setShipping]     = useState<string>('sedex');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const options = getShippingOptions(sub);
  const selectedOption = options.find((o) => o.id === shipping) ?? options[0];

  if (count === 0) {
    router.replace('/carrinho');
    return null;
  }

  async function handleCepBlur() {
    const clean = address.cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setCepLoading(true);
    const res = await lookupCep(clean);
    if (res.ok) {
      setAddress((a) => ({
        ...a,
        street:   res.street   || a.street,
        district: res.district || a.district,
        city:     res.city     || a.city,
        state:    res.state    || a.state,
      }));
    }
    setCepLoading(false);
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!customer.name.trim())  e.name  = 'Nome obrigatório.';
    if (!customer.email.trim()) e.email = 'E-mail obrigatório.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e.email = 'E-mail inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    const cep = address.cep.replace(/\D/g, '');
    if (cep.length !== 8)         e.cep    = 'CEP inválido.';
    if (!address.street.trim())   e.street = 'Rua obrigatória.';
    if (!address.number.trim())   e.number = 'Número obrigatório.';
    if (!address.city.trim())     e.city   = 'Cidade obrigatória.';
    if (!address.state.trim())    e.state  = 'Estado obrigatório.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goToPayment() {
    if (!validateStep2()) return;
    // Salva em sessionStorage para o próximo passo consumir
    sessionStorage.setItem('ot_checkout', JSON.stringify({
      customer, address, shippingId: shipping,
      shippingCost: selectedOption.price,
      shippingCarrier: selectedOption.carrier,
    }));
    router.push('/checkout/pagamento');
  }

  return (
    <div className="max-w-[520px] mx-auto">
      {/* Back */}
      <button
        type="button"
        onClick={() => step === 1 ? router.push('/carrinho') : setStep(1)}
        className="flex items-center gap-1 text-[11px] font-medium tracking-[0.16em] uppercase text-ink-mute mb-5 hover:text-ink transition-colors"
      >
        <ChevronLeft size={14} /> {step === 1 ? 'Sacola' : 'Identificação'}
      </button>

      <CheckoutStepper steps={STEPS} active={step === 1 ? 1 : 2} />

      {/* ── Passo 1: Identificação ────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="font-serif text-[22px] font-light text-ink">Identificação</h1>

          <Field label="Nome completo" error={errors.name}>
            <input
              value={customer.name}
              onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              placeholder="Clara Bianchi"
              className={inputCls(errors.name)}
              style={{ fontSize: 16 }}
            />
          </Field>

          <Field label="E-mail" error={errors.email}>
            <input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              placeholder="clara@email.com"
              className={inputCls(errors.email)}
              style={{ fontSize: 16 }}
            />
          </Field>

          <Field label="Telefone (opcional)">
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              placeholder="(21) 99999-0000"
              className={inputCls()}
              style={{ fontSize: 16 }}
            />
          </Field>

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className="mt-2 w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover transition-colors"
          >
            Continuar para entrega
          </button>
        </div>
      )}

      {/* ── Passo 2: Entrega ──────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="font-serif text-[22px] font-light text-ink">Endereço de entrega</h1>

          <div className="bg-surface rounded-[14px] px-4 py-3 border border-line">
            <p className="text-[11px] text-ink-soft">Comprando como</p>
            <p className="text-[13px] font-medium text-ink mt-0.5">{customer.name}</p>
            <p className="text-[11px] text-ink-mute">{customer.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CEP" error={errors.cep} className="col-span-1">
              <input
                value={address.cep}
                onChange={(e) => setAddress((a) => ({ ...a, cep: formatCep(e.target.value) }))}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                maxLength={9}
                className={inputCls(errors.cep)}
                style={{ fontSize: 16 }}
              />
              {cepLoading && <span className="text-[10px] text-ink-mute mt-1">Buscando…</span>}
            </Field>
            <Field label="Estado" error={errors.state}>
              <input
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0,2) }))}
                placeholder="RJ"
                maxLength={2}
                className={inputCls(errors.state)}
                style={{ fontSize: 16 }}
              />
            </Field>
          </div>

          <Field label="Rua / Avenida" error={errors.street}>
            <input
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
              placeholder="Rua das Acácias"
              className={inputCls(errors.street)}
              style={{ fontSize: 16 }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" error={errors.number}>
              <input
                value={address.number}
                onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))}
                placeholder="142"
                className={inputCls(errors.number)}
                style={{ fontSize: 16 }}
              />
            </Field>
            <Field label="Complemento">
              <input
                value={address.complement}
                onChange={(e) => setAddress((a) => ({ ...a, complement: e.target.value }))}
                placeholder="Apto 51"
                className={inputCls()}
                style={{ fontSize: 16 }}
              />
            </Field>
          </div>

          <Field label="Bairro">
            <input
              value={address.district}
              onChange={(e) => setAddress((a) => ({ ...a, district: e.target.value }))}
              placeholder="Jardim Botânico"
              className={inputCls()}
              style={{ fontSize: 16 }}
            />
          </Field>

          <Field label="Cidade" error={errors.city}>
            <input
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              placeholder="Rio de Janeiro"
              className={inputCls(errors.city)}
              style={{ fontSize: 16 }}
            />
          </Field>

          {/* Frete */}
          <div className="mt-1">
            <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2.5">Frete · Modalidade</p>
            <div className="flex flex-col gap-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setShipping(opt.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-[12px] border text-left transition-colors',
                    shipping === opt.id ? 'border-primary bg-primary-soft' : 'border-line bg-paper hover:border-ink/30'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0',
                    shipping === opt.id ? 'border-primary' : 'border-ink-mute'
                  )}>
                    {shipping === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-ink">{opt.label}</span>
                    <span className="text-[11px] text-ink-mute ml-2">{opt.days}</span>
                  </div>
                  <span className={cn('text-[13px] font-medium', opt.free ? 'text-success' : 'text-ink')}>
                    {opt.free ? 'Grátis' : brl(opt.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-bg/95 backdrop-blur-sm border-t border-line lg:static lg:mx-0 lg:px-0 lg:border-0 lg:bg-transparent"
               style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">Total com frete</span>
              <span className="font-serif text-[18px] text-ink">{brl(sub + selectedOption.price)}</span>
            </div>
            <button
              type="button"
              onClick={goToPayment}
              className="w-full h-[52px] rounded-full bg-primary text-paper text-[12px] font-medium tracking-[0.20em] uppercase hover:bg-primary-hover transition-colors"
            >
              Continuar para pagamento
            </button>
          </div>
          <div className="h-24 lg:hidden" />
        </div>
      )}
    </div>
  );
}

// ── Helpers locais ───────────────────────────────────────────────

function Field({ label, error, children, className }: {
  label: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-[10px] font-medium tracking-[0.20em] uppercase text-ink-soft">{label}</label>
      {children}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}

function inputCls(error?: string) {
  return cn(
    'w-full h-[52px] bg-paper border rounded-[12px] px-4 text-[13px] text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 transition-colors',
    error ? 'border-danger focus:ring-danger' : 'border-line focus:ring-primary focus:border-primary'
  );
}
