import type { HeroSlide } from '@/app/(app)/mais/shop-config-actions';

export function parseHeroSlides(config: Record<string, string>): HeroSlide[] {
  return [1, 2, 3].map((n) => ({
    imageUrl:  config[`shop_hero_${n}_image_url`]  ?? '',
    eyebrow:   config[`shop_hero_${n}_eyebrow`]    ?? '',
    title:     config[`shop_hero_${n}_title`]      ?? '',
    ctaLabel:  config[`shop_hero_${n}_cta_label`]  ?? '',
    ctaHref:   config[`shop_hero_${n}_cta_href`]   ?? '',
  })).filter((s) => s.title !== '');
}
