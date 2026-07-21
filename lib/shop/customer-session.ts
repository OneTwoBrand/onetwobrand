import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ot_customer_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type CustomerSession = {
  email: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SHOP_SESSION_SECRET ?? process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SHOP_SESSION_SECRET ou ENCRYPTION_SECRET deve ter ao menos 32 caracteres.');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  } satisfies CustomerSession)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): CustomerSession | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CustomerSession;
    if (!session.email || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function assertCustomerSessionConfigured(): void {
  getSecret();
}

export async function setCustomerSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getCustomerSessionEmail(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token)?.email ?? null;
}
