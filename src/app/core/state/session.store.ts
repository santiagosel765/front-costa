import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { ApiService } from '../services/api.service';
import { resolveModulePresentation, normalizeModuleName } from '../constants/module-route-map';
import {
  AuthContextModule,
  AuthContextPermissions,
  AuthContextResponse,
  AuthContextToken,
  AuthContextTenant,
  AuthContextUser,
  normalizeAuthContextModule,
  normalizeAuthContextPermissions,
  normalizeAuthContextUser,
} from '../models/auth-context.models';
import { isJwtExpired } from '../utils/jwt.util';

interface SessionState {
  accessToken: string | null;
  expiresAt: string | null;
  user: AuthContextUser | null;
  tenant: AuthContextTenant | null;
  roles: string[];
  modules: AuthContextModule[];
  permissions: AuthContextPermissions;
  serverTime: string | null;
}

const STORAGE_KEY = 'authSessionContext';

const INITIAL_STATE: SessionState = {
  accessToken: null,
  expiresAt: null,
  user: null,
  tenant: null,
  roles: [],
  modules: [],
  permissions: {},
  serverTime: null,
};

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  private readonly stateSubject = new BehaviorSubject<SessionState>(this.loadInitialState());
  readonly state$ = this.stateSubject.asObservable();

  readonly modules$ = this.state$.pipe(map((state) => this.getActiveModulesFromState(state)));
  readonly permissions$ = this.state$.pipe(map((state) => state.permissions));

  get snapshot(): SessionState {
    return this.stateSubject.value;
  }

  setToken(token: string | null, expiresAt?: string | null): void {
    const current = this.snapshot;
    this.updateState({
      ...current,
      accessToken: token,
      expiresAt: expiresAt ?? current.expiresAt ?? null,
    });
  }

  setContext(context: AuthContextResponse): void {
    this.updateState({
      accessToken: context.token?.accessToken ?? this.snapshot.accessToken,
      expiresAt: context.token?.expiresAt ?? this.snapshot.expiresAt,
      user: normalizeAuthContextUser(context.user),
      tenant: context.tenant,
      roles: context.roles ?? [],
      modules: (context.modules ?? []).map((module) => normalizeAuthContextModule(module)),
      permissions: normalizeAuthContextPermissions(context.permissions),
      serverTime: context.serverTime ?? null,
    });

    this.loadEffectivePermissions().subscribe();
  }

  hasPermission(moduleKey: string, perm: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    const normalizedModuleKey = normalizeModuleName(moduleKey) ?? moduleKey;
    const permissions = this.snapshot.permissions[normalizedModuleKey] ?? { read: false, write: false, delete: false };
    const normalizedPerm = perm.toLowerCase() as keyof AuthContextPermissions[string];
    return Boolean(permissions[normalizedPerm]);
  }

  canWrite(moduleKey: string): boolean {
    return this.hasPermission(moduleKey, 'write');
  }

  canRead(moduleKey: string): boolean {
    return this.hasPermission(moduleKey, 'read') || this.canWrite(moduleKey);
  }

  isAdmin(): boolean {
    return this.snapshot.roles.some((role) => {
      const normalizedRole = role.trim().toUpperCase();
      return normalizedRole.includes('ADMIN');
    });
  }

  isAuthenticated(): boolean {
    const token = this.snapshot.accessToken;
    return !!token && !isJwtExpired(token);
  }

  isTokenExpired(): boolean {
    const token = this.snapshot.accessToken;
    return !token || isJwtExpired(token);
  }

  hasContextLoaded(): boolean {
    return !!this.snapshot.user;
  }

  hasEnabledModule(moduleKey: string | undefined): boolean {
    if (!moduleKey) {
      return true;
    }

    const expected = normalizeModuleName(moduleKey) ?? moduleKey;
    return this.getActiveModules().some((module) => {
      const normalizedKey = normalizeModuleName(module.moduleKey) ?? module.moduleKey;
      return normalizedKey === expected;
    });
  }

  getActiveModules(): AuthContextModule[] {
    return this.getActiveModulesFromState(this.snapshot);
  }

  getPrimaryRoute(): string {
    const firstModule = this.getActiveModules()[0];

    if (!firstModule) {
      return '/main/welcome';
    }

    return resolveModulePresentation(firstModule).route;
  }

  getToken(): string | null {
    return this.snapshot.accessToken;
  }

  loadEffectivePermissions(): Observable<AuthContextPermissions> {
    const roleId = this.resolveRoleId();
    if (!roleId) {
      return of(this.snapshot.permissions);
    }

    const params = new HttpParams().set('roleId', roleId);
    return this.api.get<unknown>('/v1/auth/admin/role-permissions', { params }).pipe(
      map((response) => this.normalizeEffectivePermissionsResponse(response)),
      tap((permissions) => {
        this.updateState({
          ...this.snapshot,
          permissions,
        });
      }),
      catchError(() => of(this.snapshot.permissions)),
    );
  }

  clearSession(redirectToLogin = true): void {
    this.updateState(INITIAL_STATE);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem(STORAGE_KEY);

    if (redirectToLogin) {
      this.router.navigate(['/auth/login']);
    }
  }

  refreshStateFromStorage(): Observable<SessionState> {
    this.updateState(this.loadInitialState());
    return of(this.snapshot);
  }

  private getActiveModulesFromState(state: SessionState): AuthContextModule[] {
    const now = Date.now();
    return (state.modules ?? []).filter((module) => {
      const statusValue = module?.statusId ?? module?.statusCode;
      const isStatusEnabled = statusValue === undefined || statusValue === null
        ? true
        : String(statusValue).toUpperCase() === '1' || String(statusValue).toUpperCase() === 'ACTIVE';

      if (!module?.enabled || !isStatusEnabled) {
        return false;
      }

      if (!module.expiresAt) {
        return true;
      }

      const expiresAt = new Date(module.expiresAt).getTime();
      return Number.isFinite(expiresAt) && expiresAt > now;
    });
  }

  private updateState(nextState: SessionState): void {
    this.stateSubject.next(nextState);

    if (nextState.accessToken) {
      sessionStorage.setItem('authToken', nextState.accessToken);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      return;
    }

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private loadInitialState(): SessionState {
    const token = sessionStorage.getItem('authToken');
    const rawState = sessionStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return {
        ...INITIAL_STATE,
        accessToken: token,
      };
    }

    try {
      const parsed = JSON.parse(rawState) as SessionState;
      return {
        ...INITIAL_STATE,
        ...parsed,
        user: parsed.user ? normalizeAuthContextUser(parsed.user) : null,
        modules: (parsed.modules ?? []).map((module) => normalizeAuthContextModule(module)),
        permissions: normalizeAuthContextPermissions(parsed.permissions),
        accessToken: token ?? parsed.accessToken,
      };
    } catch {
      return {
        ...INITIAL_STATE,
        accessToken: token,
      };
    }
  }

  private resolveRoleId(): string | null {
    const userRoleId = this.snapshot.user?.roleIds?.find((id) => this.isUuid(id));
    if (userRoleId) {
      return userRoleId;
    }

    return this.snapshot.roles.find((role) => this.isUuid(role)) ?? null;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private normalizeEffectivePermissionsResponse(response: unknown): AuthContextPermissions {
    if (!response) {
      return this.snapshot.permissions;
    }

    if (Array.isArray(response)) {
      return response.reduce<AuthContextPermissions>((acc, item) => {
        if (!item || typeof item !== 'object') {
          return acc;
        }

        const entry = item as Record<string, unknown>;
        const rawModuleKey = entry['moduleKey'];
        if (typeof rawModuleKey !== 'string') {
          return acc;
        }

        const moduleKey = normalizeModuleName(rawModuleKey) ?? rawModuleKey;
        acc[moduleKey] = {
          read: Boolean(entry['read']),
          write: Boolean(entry['write']),
          delete: Boolean(entry['delete']),
        };
        return acc;
      }, {});
    }

    if (typeof response === 'object') {
      return normalizeAuthContextPermissions(response as Record<string, unknown>);
    }

    return this.snapshot.permissions;
  }
}
