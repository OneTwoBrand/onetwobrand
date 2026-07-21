import { describe, expect, it } from 'vitest';
import { getSafePublicHref, parseInstitutionalSlides, parsePublicSiteMode } from './institutional';

describe('institutional public mode', () => {
  it('only enables the institutional mode explicitly', () => {
    expect(parsePublicSiteMode('institutional')).toBe('institutional');
    expect(parsePublicSiteMode('store')).toBe('store');
    expect(parsePublicSiteMode(undefined)).toBe('store');
  });

  it('keeps only slides with a title', () => {
    const slides = parseInstitutionalSlides({
      shop_institutional_1_title: 'Atelier',
      shop_institutional_1_description: 'Feito à mão',
      shop_institutional_2_description: 'Sem título',
    });
    expect(slides).toHaveLength(1);
    expect(slides[0]?.title).toBe('Atelier');
  });

  it('only allows internal, HTTPS, HTTP and mailto calls to action', () => {
    expect(getSafePublicHref('/contato')).toBe('/contato');
    expect(getSafePublicHref('https://example.com')).toBe('https://example.com/');
    expect(getSafePublicHref('javascript:alert(1)')).toBe('#contato');
    expect(getSafePublicHref('//example.com')).toBe('#contato');
  });
});
