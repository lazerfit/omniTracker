const COOKIE_NAME = 'omnitracker-session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importHmacKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('ENCRYPTION_KEY is not set');
  return crypto.subtle.importKey(
    'raw',
    hexToBytes(keyHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSessionToken(): Promise<string> {
  const key = await importHmacKey();
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS });
  const encoded = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
  return `${encoded}.${bytesToHex(sig)}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return false;
    const encoded = token.slice(0, dot);
    const sigHex = token.slice(dot + 1);
    const key = await importHmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(sigHex),
      new TextEncoder().encode(encoded),
    );
    if (!valid) return false;
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(padded)) as { exp: number };
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
