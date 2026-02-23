import { Injectable, inject } from '@angular/core';

import { normalizeModuleName } from '../constants/module-route-map';
import { SessionStore } from '../state/session.store';

@Injectable({ providedIn: 'root' })
export class ModuleAccessService {
  private readonly sessionStore = inject(SessionStore);

  hasModule(moduleCode: string): boolean {
    const normalizedCode = normalizeModuleName(moduleCode) ?? moduleCode;
    return this.sessionStore.hasEnabledModule(normalizedCode);
  }
}
