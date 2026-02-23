import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap } from 'rxjs';

import { ApiService } from './api.service';
import { normalizeModuleName } from '../constants/module-route-map';
import { AuthContextModule, AuthContextResponse } from '../models/auth-context.models';
import { ModulesService } from './modules.service';
import { SessionStore } from '../state/session.store';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private readonly api = inject(ApiService);
  private readonly modulesService = inject(ModulesService);
  private readonly sessionStore = inject(SessionStore);

  loadContext(): Observable<AuthContextResponse> {
    return this.api.get<AuthContextResponse>('/v1/auth/me/context').pipe(
      tap((context) => this.sessionStore.setContext(context)),
      catchError(() => this.loadContextFromLegacyModules()),
    );
  }

  private loadContextFromLegacyModules(): Observable<AuthContextResponse> {
    return this.modulesService.getAllModules().pipe(
      map((modules) => {
        const token = this.sessionStore.getToken();

        return {
          user: this.sessionStore.snapshot.user ?? { id: 'unknown', username: 'unknown' },
          tenant: this.sessionStore.snapshot.tenant ?? { tenantId: 'unknown', name: 'unknown' },
          roles: this.sessionStore.snapshot.roles,
          modules: modules.map((module) => ({
            key: normalizeModuleName(module.name) ?? module.name,
            label: module.name,
            enabled: module.status === 1,
            baseRoute: null,
            expiresAt: null,
          })) as AuthContextModule[],
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
}
