import { describe, expect, it } from 'vitest';
import { isPublicPath } from './public-paths';

describe('public auth paths', () => {
  it('allows the auth callback before a session exists', () => {
    expect(isPublicPath('/auth/callback')).toBe(true);
  });

  it('does not expose paths that only share a public prefix', () => {
    expect(isPublicPath('/login-admin')).toBe(false);
    expect(isPublicPath('/conta-interna')).toBe(false);
  });
});
