import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { resolveModulePresentation, normalizeModuleName } from '../constants/module-route-map';
import {
  AuthContextModule,
  AuthContextPermissions,
  AuthContextResponse,
  AuthContextToken,
  AuthContextTenant,
  AuthContextUser,
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

  private readonly stateSubject = new BehaviorSubject<SessionState>(this.loadInitialState());
  readonly state$ = this.stateSubject.asObservable();

  readonly modules$ = this.state$.pipe(map((state) => this.getActiveModulesFromState(state)));

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
      modules: context.modules ?? [],
      permissions: normalizeAuthContextPermissions(context.permissions),
      serverTime: context.serverTime ?? null,
    });
  }

  hasPermission(moduleKey: string, perm: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    const normalizedModuleKey = normalizeModuleName(moduleKey) ?? moduleKey;
    const permissions = this.snapshot.permissions[normalizedModuleKey] ?? [];
    return permissions.includes(perm.toLowerCase());
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
      const normalizedKey = normalizeModuleName(module.key) ?? module.key;
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
}
