import { User } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function ClientesPage() {
  return <SimpleModulePage eyebrow="Clientes" title="142 cadastros" icon={<User size={34} strokeWidth={1.4} />} />;
}
