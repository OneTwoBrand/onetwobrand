export const AUTH_CALLBACK_PATH = '/auth/callback';

export type PasswordFlow = 'invite' | 'recovery';

export function parsePasswordFlow(value: string | null): PasswordFlow | null {
  return value === 'invite' || value === 'recovery' ? value : null;
}

export function buildAuthCallbackUrl(siteUrl: string, flow: PasswordFlow) {
  const callbackUrl = new URL(AUTH_CALLBACK_PATH, siteUrl);
  callbackUrl.searchParams.set('flow', flow);
  return callbackUrl.toString();
}

export function buildPasswordSetupPath(flow: PasswordFlow) {
  const searchParams = new URLSearchParams({ flow });
  return `/nova-senha?${searchParams.toString()}`;
}
