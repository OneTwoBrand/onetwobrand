import { describe, expect, it } from 'vitest';
import { parsePageContent } from './parse-page-content';

describe('parsePageContent', () => {
  it('escapes raw HTML while preserving supported formatting', () => {
    const html = parsePageContent('## Política\n<script>alert(1)</script> **seguro**');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong class="text-ink font-medium">seguro</strong>');
  });

  it('removes unsafe link protocols', () => {
    const html = parsePageContent('[abrir](javascript:alert(1))');
    expect(html).toContain('abrir');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('javascript:');
  });

  it('keeps safe internal and HTTPS links', () => {
    const html = parsePageContent('[loja](/loja) [site](https://example.com/a)');
    expect(html).toContain('href="/loja"');
    expect(html).toContain('href="https://example.com/a"');
  });
});
