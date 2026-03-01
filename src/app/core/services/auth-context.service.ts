import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap } from 'rxjs';

import { ApiService } from './api.service';
import { normalizeModuleName } from '../constants/module-route-map';
import {
  AuthContextResponse,
  normalizeAuthContextModule,
  normalizeAuthContextPermissions,
  normalizeAuthContextUser,
} from '../models/auth-context.models';
import { ModulesService } from './modules.service';
import { SessionStore } from '../state/session.store';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private readonly api = inject(ApiService);
  private readonly modulesService = inject(ModulesService);
  private readonly sessionStore = inject(SessionStore);

  loadContext(): Observable<AuthContextResponse> {
    return this.api.get<AuthContextResponse>('/v1/auth/me/context').pipe(
      map((context) => this.normalizeContext(context)),
      tap((context) => this.sessionStore.setContext(context)),
      catchError(() => this.loadContextFromLegacyModules()),
    );
  }

  private loadContextFromLegacyModules(): Observable<AuthContextResponse> {
    return this.modulesService.getAllModules().pipe(
      map((modules) => {
        const token = this.sessionStore.getToken();

        return {
          user: normalizeAuthContextUser(
            this.sessionStore.snapshot.user ?? { id: 'unknown', username: 'unknown', statusKey: 'UNKNOWN' },
          ),
          tenant: this.sessionStore.snapshot.tenant ?? { tenantId: 'unknown', name: 'unknown' },
          roles: this.sessionStore.snapshot.roles,
          modules: modules
            .filter((module) => module.status === 1)
            .map((module) => normalizeAuthContextModule({
              moduleKey: normalizeModuleName(module.moduleKey) ?? normalizeModuleName(module.name) ?? module.name,
              name: module.name,
              enabled: module.status === 1,
              statusCode: module.status,
              baseRoute: null,
              expiresAt: null,
            })),
          permissions: {},
          token: {
            accessToken: token ?? '',
            expiresAt: this.sessionStore.snapshot.expiresAt,
          },
          serverTime: new Date().toISOString(),
        } as AuthContextResponse;
      }),
      tap((context) => this.sessionStore.setContext(context)),
    );
  }

  private normalizeContext(context: AuthContextResponse): AuthContextResponse {
    return {
      ...context,
      user: normalizeAuthContextUser(context.user),
      modules: (context.modules ?? [])
        .map((module) => normalizeAuthContextModule(module))
        .filter((module) => module.enabled && this.isModuleActive(module.statusCode ?? module.statusId)),
      permissions: normalizeAuthContextPermissions(context.permissions),
    };
  }

  private isModuleActive(status?: string | number): boolean {
    if (status === undefined || status === null) {
      return true;
    }

    const normalized = String(status).toUpperCase();
    return normalized === '1' || normalized === 'ACTIVE';
  }
}
