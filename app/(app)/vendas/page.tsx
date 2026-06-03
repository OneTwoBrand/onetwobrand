import { ShoppingCart } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function VendasPage() {
  return <SimpleModulePage eyebrow="Vendas" title="Fluxo de vendas" icon={<ShoppingCart size={34} strokeWidth={1.4} />} />;
}
