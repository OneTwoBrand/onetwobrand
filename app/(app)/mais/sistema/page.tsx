import Link from 'next/link';
import { Bot, ChevronLeft } from 'lucide-react';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Card, Divider, SectionHead } from '@/components/ui/Primitives';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkOpenAIConfigured } from '../actions';
import { AdminAIConfigForm } from '../ProfileForm';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/mais');
}

export default async function SistemaConfigPage() {
  await requireAdmin();
  const aiConfigured = await checkOpenAIConfigured();

  return (
    <>
      <AppBar large eyebrow="Configurações" title="Sistema" />
      <Topbar eyebrow="Configurações" title="Sistema" action={<Link href="/mais" className="flex items-center gap-1 text-[11px] font-medium uppercase text-ink-mute hover:text-ink transition-colors"><ChevronLeft size={14} />Configurações</Link>} />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <section className="mx-auto max-w-xl space-y-6">

          <div className="hidden md:flex items-center gap-2 text-[12px] text-ink-soft">
            <Link href="/mais" className="hover:text-ink transition-colors">Configurações</Link>
            <span>/</span>
            <span className="text-ink font-medium">Sistema</span>
          </div>

          <Card pad={20}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Bot size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Integração IA — OneTwo Assistente</p>
                <p className="text-[11px] text-ink-soft">Restrito ao administrador de TI</p>
              </div>
            </div>
            <Divider className="mb-5" />

            <SectionHead eyebrow="OpenAI" title="Chave de API" />
            <div className="mt-3">
              <AdminAIConfigForm isConfigured={aiConfigured} />
            </div>
          </Card>

        </section>
      </main>
    </>
  );
}
