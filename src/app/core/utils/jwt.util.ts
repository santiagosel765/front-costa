export interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  const segments = token.split('.');

  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, now = Date.now()): boolean {
  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= now;
}
