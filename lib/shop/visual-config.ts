export type ShopHeroMotion = 'none' | 'soft' | 'editorial';

export type ShopVisualConfig = {
  heroMotion: ShopHeroMotion;
  spotlightAutoplay: boolean;
  collectionCardMotion: boolean;
  productCardMotion: boolean;
  sectionReveal: boolean;
};

export const DEFAULT_SHOP_VISUAL_CONFIG: ShopVisualConfig = {
  heroMotion: 'soft',
  spotlightAutoplay: true,
  collectionCardMotion: true,
  productCardMotion: true,
  sectionReveal: true,
};

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function parseShopVisualConfig(config: Record<string, string>): ShopVisualConfig {
  const motion = config.shop_visual_hero_motion;
  return {
    heroMotion: motion === 'none' || motion === 'soft' || motion === 'editorial'
      ? motion
      : DEFAULT_SHOP_VISUAL_CONFIG.heroMotion,
    spotlightAutoplay: readBoolean(config.shop_visual_spotlight_autoplay, DEFAULT_SHOP_VISUAL_CONFIG.spotlightAutoplay),
    collectionCardMotion: readBoolean(config.shop_visual_collection_card_motion, DEFAULT_SHOP_VISUAL_CONFIG.collectionCardMotion),
    productCardMotion: readBoolean(config.shop_visual_product_card_motion, DEFAULT_SHOP_VISUAL_CONFIG.productCardMotion),
    sectionReveal: readBoolean(config.shop_visual_section_reveal, DEFAULT_SHOP_VISUAL_CONFIG.sectionReveal),
  };
}
