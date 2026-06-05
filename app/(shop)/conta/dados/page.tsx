'use client';

/**
 * ONE TWO · /conta/dados
 * Exibe e atualiza nome e telefone do cliente (e-mail imutável).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { formatPhoneBR } from '@/lib/input-masks';

export default function DadosPage() {
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [custId,    setCustId]    = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      try {
        const raw = sessionStorage.getItem('ot_checkout');
        if (!raw) { setLoading(false); return; }
        const data = JSON.parse(raw) as { customer?: { name?: string; email?: string; phone?: string } };
        const em = data.customer?.email ?? '';
        setEmail(em);
        setName(data.customer?.name ?? '');
        setPhone(formatPhoneBR(data.customer?.phone ?? ''));
        if (!em) { setLoading(false); return; }

        const supabase = createClient();
        supabase
          .from('customers')
          .select('id, name, phone')
          .eq('email', em)
          .maybeSingle()
          .then(({ data: cust }) => {
            if (!active) return;
            if (cust?.id) {
              setCustId(cust.id);
              setName(cust.name ?? '');
              setPhone(formatPhoneBR(cust.phone ?? ''));
            }
            setLoading(false);
          });
      } catch {
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!custId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('customers')
      .update({ name: name.trim(), phone: phone.trim() })
      .eq('id', custId);
    setSaving(false);
    if (err) { setError(err.message); return; }

    // Atualiza sessionStorage
    try {
      const raw = sessionStorage.getItem('ot_checkout');
      if (raw) {
        const data = JSON.parse(raw);
        data.customer = { ...data.customer, name: name.trim(), phone: phone.trim() };
        sessionStorage.setItem('ot_checkout', JSON.stringify(data));
      }
    } catch { /* ok */ }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg mx-auto pt-4 pb-28 lg:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/conta" className="text-[12px] text-ink-soft hover:text-ink transition-colors">
          Minha conta
        </Link>
        <span className="text-ink-mute">/</span>
        <span className="text-[12px] text-ink font-medium">Meus dados</span>
      </div>

      <h1 className="font-serif text-[24px] font-normal text-ink mb-6">Meus dados</h1>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-[14px] bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !email && (
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-primary">
            <User size={22} strokeWidth={1.2} />
          </div>
          <p className="font-serif text-[18px] text-ink">Nenhuma conta encontrada</p>
          <p className="text-[12px] text-ink-soft max-w-[240px] leading-relaxed">
            Faça um pedido para criar automaticamente sua conta.
          </p>
          <Link
            href="/loja"
            className="mt-2 h-11 px-6 rounded-full bg-primary text-paper text-[11px] font-medium tracking-[0.18em] uppercase flex items-center"
          >
            Explorar a loja
          </Link>
        </div>
      )}

      {!loading && email && (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-ink-soft mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-[52px] px-4 rounded-[14px] border border-line bg-paper text-[14px] text-ink placeholder:text-ink-mute outline-none focus:border-primary transition-colors"
              placeholder="Seu nome"
              style={{ fontSize: 16 }}
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-ink-soft mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-[52px] px-4 rounded-[14px] border border-line bg-surface text-[14px] text-ink-soft cursor-not-allowed"
              style={{ fontSize: 16 }}
            />
            <p className="text-[11px] text-ink-mute mt-1">O e-mail não pode ser alterado.</p>
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase text-ink-soft mb-2">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              className="w-full h-[52px] px-4 rounded-[14px] border border-line bg-paper text-[14px] text-ink placeholder:text-ink-mute outline-none focus:border-primary transition-colors"
              placeholder="(67) 9 0000-0000"
              style={{ fontSize: 16 }}
            />
          </div>

          {error && (
            <p className="text-[12px] text-danger px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || saved || !custId}
            className="w-full h-[52px] rounded-full flex items-center justify-center gap-2 text-[11px] font-medium tracking-[0.20em] uppercase transition-colors disabled:opacity-60 bg-primary text-paper hover:bg-primary/90"
          >
            {saved ? (
              <>
                <CheckCircle2 size={15} />
                Salvo com sucesso
              </>
            ) : saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </form>
      )}
    </div>
  );
}
