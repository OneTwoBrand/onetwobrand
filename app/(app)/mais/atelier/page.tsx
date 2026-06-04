import Link from 'next/link';
import { ChevronLeft, Scissors } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';

import { Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowConfig } from '@/lib/workflow-config';
import {
  OpStatusesForm,
  ProductionStepsForm,
  SeamstressRolesForm,
  EmbroideryTypesForm,
} from '../WorkflowConfigForms';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/mais');
}

export default async function AtelierConfigPage() {
  await requireAdmin();
  const config = await getWorkflowConfig();

  return (
    <>
      <AppBar large eyebrow="Configurações" title="Atelier" />
      <Topbar
        eyebrow="Configurações"
        title="Atelier"
        action={
          <Link href="/mais" className="flex items-center gap-1 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-mute hover:text-ink transition-colors">
            <ChevronLeft size={14} /> Configurações
          </Link>
        }
      />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-xl space-y-6">

          <div className="hidden md:flex items-center gap-2 text-[12px] text-ink-soft">
            <Link href="/mais" className="hover:text-ink transition-colors">Configurações</Link>
            <span>/</span>
            <span className="text-ink font-medium">Atelier</span>
          </div>

          <Card pad={20}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Scissors size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Atelier</p>
                <p className="text-[11px] text-ink-soft">Fluxo de produção e funções</p>
              </div>
            </div>
            <Divider className="mb-5" />

            <SectionHead eyebrow="Produção" title="Status das OPs" />
            <div className="mt-3">
              <OpStatusesForm config={config} />
            </div>

            <Divider className="my-6" />

            <SectionHead eyebrow="Produção" title="Etapas do processo" />
            <div className="mt-3">
              <ProductionStepsForm config={config} />
            </div>

            <Divider className="my-6" />

            <SectionHead eyebrow="Equipe" title="Funções de costureira" />
            <div className="mt-3">
              <SeamstressRolesForm config={config} />
            </div>

            <Divider className="my-6" />

            <SectionHead eyebrow="Bordagem" title="Tipos de bordagem" />
            <div className="mt-3">
              <EmbroideryTypesForm config={config} />
            </div>
          </Card>

        </section>
      </main>
    </>
  );
}
