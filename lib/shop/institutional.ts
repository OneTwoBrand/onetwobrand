export type PublicSiteMode = 'store' | 'institutional';

export type InstitutionalSlide = {
  imageUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function parsePublicSiteMode(value: string | null | undefined): PublicSiteMode {
  return value === 'institutional' ? 'institutional' : 'store';
}

export function parseInstitutionalSlides(config: Record<string, string>): InstitutionalSlide[] {
  return [1, 2, 3, 4].map((slot) => ({
    imageUrl: config[`shop_institutional_${slot}_image_url`] ?? '',
    eyebrow: config[`shop_institutional_${slot}_eyebrow`] ?? '',
    title: config[`shop_institutional_${slot}_title`] ?? '',
    description: config[`shop_institutional_${slot}_description`] ?? '',
    ctaLabel: config[`shop_institutional_${slot}_cta_label`] ?? '',
    ctaHref: config[`shop_institutional_${slot}_cta_href`] ?? '',
  })).filter((slide) => slide.title !== '');
}

export function getSafePublicHref(value: string, fallback = '#contato'): string {
  const href = value.trim();
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  try {
    const parsed = new URL(href);
    return ['https:', 'http:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}
