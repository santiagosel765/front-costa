export interface AuthContextUser {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  status?: string | number;
  statusCode?: string | number;
  statusLabel?: string;
  statusKey?: string;
  statusId?: string | number;
}

export interface AuthContextTenant {
  tenantId: string;
  name: string;
  status?: string | number;
}

export interface AuthContextModule {
  key: string;
  label?: string | null;
  enabled: boolean;
  statusCode?: string | number;
  statusId?: string | number;
  statusLabel?: string;
  expiresAt?: string | null;
  baseRoute?: string | null;
  icon?: string | null;
}

export interface AuthContextToken {
  accessToken: string;
  expiresAt?: string | null;
}

export interface AuthContextResponse {
  user: AuthContextUser;
  tenant: AuthContextTenant;
  roles: string[];
  modules: AuthContextModule[];
  permissions?: AuthContextPermissions | null;
  token: AuthContextToken;
  serverTime?: string;
}

export type AuthContextPermissions = Record<string, string[]>;

const KNOWN_STATUS_KEYS = new Set(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'SUSPENDED']);

export function normalizeAuthContextUser(user: AuthContextUser): AuthContextUser {
  const statusId = user.statusId ?? user.statusCode ?? user.status;
  const statusKey = resolveStatusKey(user.statusKey ?? user.statusCode ?? user.status);

  return {
    ...user,
    statusId: statusId ?? undefined,
    statusKey,
  };
}

export function normalizeAuthContextPermissions(
  permissions?: AuthContextPermissions | null,
): AuthContextPermissions {
  if (!permissions) {
    return {};
  }

  return Object.entries(permissions).reduce<AuthContextPermissions>((acc, [moduleKey, values]) => {
    acc[moduleKey] = (values ?? []).map((value) => value.toLowerCase());
    return acc;
  }, {});
}

function resolveStatusKey(status?: string | number): string {
  if (typeof status === 'number') {
    return status === 1 ? 'ACTIVE' : 'INACTIVE';
  }

  if (typeof status !== 'string') {
    return 'UNKNOWN';
  }

  const normalized = status.trim().toUpperCase();
  if (KNOWN_STATUS_KEYS.has(normalized)) {
    return normalized;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return 'UNKNOWN';
  }

  return normalized || 'UNKNOWN';
}
