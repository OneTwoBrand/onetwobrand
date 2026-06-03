import { BarChart3 } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function RelatoriosPage() {
  return <SimpleModulePage eyebrow="Relatórios" title="Visão geral" icon={<BarChart3 size={34} strokeWidth={1.4} />} />;
}
