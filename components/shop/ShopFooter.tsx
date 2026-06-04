/**
 * ONE TWO · ShopFooter
 * Rodapé slim da loja pública.
 * Server Component — lê redes sociais do platform_config.
 */
import Link from 'next/link';
import { getPlatformConfig } from '@/lib/platform-config';

export async function ShopFooter() {
  const [instagram, whatsapp] = await Promise.all([
    getPlatformConfig('shop_instagram'),
    getPlatformConfig('shop_whatsapp'),
  ]);

  // Normaliza Instagram: aceita "@handle" ou URL completa
  const instagramHref = instagram
    ? instagram.startsWith('http')
      ? instagram
      : `https://instagram.com/${instagram.replace(/^@/, '')}`
    : 'https://instagram.com';

  // WhatsApp: remove formatação e monta link direto
  const whatsappHref = whatsapp
    ? `https://wa.me/55${whatsapp.replace(/\D/g, '')}`
    : null;

  const navLinks = [
    { href: '/loja',              label: 'Loja' },
    { href: '/loja/trocas',       label: 'Trocas e devoluções' },
    { href: '/loja/privacidade',  label: 'Privacidade' },
    { href: instagramHref,        label: 'Instagram' },
    ...(whatsappHref ? [{ href: whatsappHref, label: 'WhatsApp' }] : []),
  ];

  return (
    <footer className="border-t border-line mt-16 mb-20 lg:mb-0">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-14 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <span className="text-[11px] text-ink-mute tracking-[0.14em] uppercase">
          © ONE TWO · crafted pieces
        </span>
        <nav className="flex items-center gap-5 flex-wrap justify-center">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-[11px] text-ink-soft tracking-[0.12em] uppercase hover:text-ink transition-colors"
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="text-[10px] text-ink-mute tracking-[0.14em] uppercase hover:text-ink-soft transition-colors"
        >
          Desenvolvido por Girassol Inteligência
        </Link>
      </div>
    </footer>
  );
}
