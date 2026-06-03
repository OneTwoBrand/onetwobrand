import { Menu } from 'lucide-react';
import { SimpleModulePage } from '@/components/app/SimpleModulePage';

export default function MaisPage() {
  return <SimpleModulePage eyebrow="Mais" title="Áreas adicionais" icon={<Menu size={34} strokeWidth={1.4} />} />;
}
