import { describe, expect, it } from 'vitest';
import {
  buildAuthCallbackUrl,
  buildPasswordSetupPath,
  parsePasswordFlow,
} from './auth-flow';

describe('auth flow URLs', () => {
  it('builds a canonical invite callback URL even when the site URL has a path', () => {
    expect(buildAuthCallbackUrl('https://one2brand.com.br/admin/', 'invite')).toBe(
      'https://one2brand.com.br/auth/callback?flow=invite'
    );
  });

  it('only accepts supported password flows', () => {
    expect(parsePasswordFlow('invite')).toBe('invite');
    expect(parsePasswordFlow('recovery')).toBe('recovery');
    expect(parsePasswordFlow('other')).toBeNull();
    expect(parsePasswordFlow(null)).toBeNull();
  });

  it('keeps the post-callback destination internal and fixed', () => {
    expect(buildPasswordSetupPath('invite')).toBe('/nova-senha?flow=invite');
    expect(buildPasswordSetupPath('recovery')).toBe('/nova-senha?flow=recovery');
  });
});
