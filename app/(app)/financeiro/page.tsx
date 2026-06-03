import { CircleDollarSign } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function FinanceiroPage() {
  return <SimpleModulePage eyebrow="Financeiro" title="Junho 2026" icon={<CircleDollarSign size={34} strokeWidth={1.4} />} />;
}
