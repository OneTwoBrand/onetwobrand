import { redirect } from 'next/navigation';

// Redirect permanente para manter compatibilidade com links externos e bookmarks
export default function ColecoesRedirect() {
  redirect('/loja/colecoes');
}
