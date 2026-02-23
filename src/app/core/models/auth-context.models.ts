export interface AuthContextUser {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  status?: string | number;
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
  token: AuthContextToken;
  serverTime?: string;
}
