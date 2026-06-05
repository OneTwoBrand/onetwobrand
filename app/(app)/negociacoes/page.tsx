import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Card, SectionHead } from '@/components/ui/Primitives';
import { createClient } from '@/lib/supabase/server';
import { getPlatformConfig } from '@/lib/platform-config';
import { getLeads } from './actions';
import { LeadCard } from './LeadCard';

async function getCurrentRole(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return data?.role ?? '';
}

export default async function NegociacoesPage() {
  const role = await getCurrentRole();
  if (!['admin', 'vendedora', 'atelier'].includes(role)) redirect('/');

  const [{ leads, error }, waNumber] = await Promise.all([
    getLeads(),
    getPlatformConfig('shop_whatsapp'),
  ]);

  const waHref = waNumber
    ? `https://wa.me/55${waNumber.replace(/\D/g, '')}`
    : null;

  const novo          = leads.filter((l) => l.status === 'novo');
  const emAtendimento = leads.filter((l) => l.status === 'em_atendimento');
  const fechado       = leads.filter((l) => l.status === 'fechado');
  const perdido       = leads.filter((l) => l.status === 'perdido');

  return (
    <>
      <AppBar large eyebrow="Comercial" title={`${leads.length} negociações`} />
      <Topbar eyebrow="Comercial" title={`${leads.length} negociações`} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-5xl space-y-6">

          {error && (
            <Card pad={16}><p className="text-[12px] text-danger">{error}</p></Card>
          )}

          {leads.length === 0 && !error && (
            <Card pad={24}>
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <MessageCircle size={32} className="text-ink-mute" strokeWidth={1.2} />
                <p className="text-[14px] text-ink-soft">Nenhuma negociação ainda.</p>
                <p className="text-[12px] text-ink-mute max-w-xs">
                  Quando uma cliente clicar em "Negociar pelo WhatsApp" na loja, o interesse aparecerá aqui.
                </p>
              </div>
            </Card>
          )}

          {/* KPIs */}
          {leads.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Novos',          value: novo.length,          color: 'text-primary' },
                { label: 'Em atendimento', value: emAtendimento.length, color: 'text-secondary' },
                { label: 'Fechados',       value: fechado.length,       color: 'text-success' },
                { label: 'Perdidos',       value: perdido.length,       color: 'text-ink-soft' },
              ].map((kpi) => (
                <Card key={kpi.label} pad={14}>
                  <p className={`font-serif text-[28px] leading-none ${kpi.color}`}>{kpi.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-soft">{kpi.label}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Novos */}
          {novo.length > 0 && (
            <div>
              <SectionHead eyebrow="Aguardando atendimento" title="Novos" />
              <div className="grid gap-3 md:grid-cols-2">
                {novo.map((lead) => (
                  <LeadCard key={lead.id} lead={lead as Parameters<typeof LeadCard>[0]['lead']} waHref={waHref} />
                ))}
              </div>
            </div>
          )}

          {/* Em atendimento */}
          {emAtendimento.length > 0 && (
            <div>
              <SectionHead eyebrow="Em progresso" title="Em atendimento" />
              <div className="grid gap-3 md:grid-cols-2">
                {emAtendimento.map((lead) => (
                  <LeadCard key={lead.id} lead={lead as Parameters<typeof LeadCard>[0]['lead']} waHref={waHref} />
                ))}
              </div>
            </div>
          )}

          {/* Fechados + Perdidos */}
          {(fechado.length > 0 || perdido.length > 0) && (
            <div>
              <SectionHead eyebrow="Concluídos" title="Fechados e perdidos" />
              <div className="grid gap-3 md:grid-cols-2">
                {[...fechado, ...perdido].map((lead) => (
                  <LeadCard key={lead.id} lead={lead as Parameters<typeof LeadCard>[0]['lead']} waHref={waHref} />
                ))}
              </div>
            </div>
          )}

        </section>
      </main>
    </>
  );
}
