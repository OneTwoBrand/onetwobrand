import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ONE TWO Manager',
    short_name: 'ONE TWO',
    description: 'Plataforma administrativa premium da ONE TWO crafted pieces.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F1E0A8',
    theme_color: '#6F1628',
    icons: [
      {
        src: '/one-two-logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
