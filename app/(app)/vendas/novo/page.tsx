import { ShoppingCart } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function NovaVendaPage() {
  return <SimpleModulePage eyebrow="Nova venda" title="Cliente · Peças · Pagamento" icon={<ShoppingCart size={34} strokeWidth={1.4} />} />;
}
