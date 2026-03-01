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
  roleIds?: string[];
}

export interface AuthContextTenant {
  tenantId: string;
  name: string;
  status?: string | number;
}

export interface AuthContextModule {
  // moduleKey es la key técnica estable; name es únicamente el label de UI.
  moduleKey: string;
  name: string;
  enabled: boolean;
  statusCode?: string | number;
  statusId?: string | number;
  statusLabel?: string;
  expiresAt?: string | null;
  baseRoute?: string | null;
  icon?: string | null;
}

export interface RawAuthContextModule extends Partial<AuthContextModule> {
  module_key?: string;
  label?: string;
  status_code?: string | number;
  status_id?: string | number;
  status_label?: string;
  expires_at?: string | null;
  base_route?: string | null;
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

export interface PermissionAccess {
  read: boolean;
  write: boolean;
  delete?: boolean;
}

export type AuthContextPermissions = Record<string, PermissionAccess>;

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
  permissions?: Record<string, unknown> | null,
): AuthContextPermissions {
  if (!permissions) {
    return {};
  }

  return Object.entries(permissions).reduce<AuthContextPermissions>((acc, [moduleKey, rawValue]) => {
    const normalizedKey = moduleKey.toUpperCase();

    if (Array.isArray(rawValue)) {
      const values = rawValue.map((value) => String(value).toLowerCase());
      acc[normalizedKey] = {
        read: values.includes('read'),
        write: values.includes('write'),
        delete: values.includes('delete'),
      };
      return acc;
    }

    if (rawValue && typeof rawValue === 'object') {
      const value = rawValue as Partial<Record<keyof PermissionAccess, unknown>>;
      acc[normalizedKey] = {
        read: Boolean(value.read),
        write: Boolean(value.write),
        delete: Boolean(value.delete),
      };
      return acc;
    }

    acc[normalizedKey] = { read: false, write: false, delete: false };
    return acc;
  }, {});
}

export function normalizeAuthContextModule(module: RawAuthContextModule): AuthContextModule {
  const moduleKey = String(module.moduleKey ?? module.module_key ?? '').trim();
  const normalizedModuleKey = moduleKey.toUpperCase();

  const statusCode = module.statusCode ?? module.status_code;
  const statusId = module.statusId ?? module.status_id;
  const rawEnabled = module.enabled;
  const enabledFromStatus = [statusCode, statusId].some(
    (value) => value !== undefined && value !== null && String(value).toUpperCase() === '1',
  );

  return {
    moduleKey: normalizedModuleKey,
    name: String(module.name ?? module.label ?? normalizedModuleKey),
    enabled: typeof rawEnabled === 'boolean' ? rawEnabled : ([statusCode, statusId].every((value) => value === undefined || value === null) ? true : enabledFromStatus),
    statusCode: statusCode as string | number | undefined,
    statusId: statusId as string | number | undefined,
    statusLabel: (module.statusLabel ?? module.status_label) as string | undefined,
    expiresAt: (module.expiresAt ?? module.expires_at) as string | null | undefined,
    baseRoute: (module.baseRoute ?? module.base_route) as string | null | undefined,
    icon: module.icon as string | null | undefined,
  };
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
