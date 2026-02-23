import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanMatch,
  Route,
  Router,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';

import { normalizeModuleName } from '../constants/module-route-map';
import { SessionStore } from '../state/session.store';

@Injectable({
  providedIn: 'root',
})
export class ModuleGuard implements CanActivate, CanMatch {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return of(this.validate(route.data?.['moduleKey']));
  }

  canMatch(route: Route): Observable<boolean | UrlTree> {
    return of(this.validate(route.data?.['moduleKey'] as string | undefined));
  }

  private validate(moduleKeyRaw?: string): boolean | UrlTree {
    const moduleKey = normalizeModuleName(moduleKeyRaw) ?? moduleKeyRaw?.replace(/\s+/g, '_').toUpperCase();

    if (!moduleKey) {
      return true;
    }

    return this.sessionStore.hasEnabledModule(moduleKey) ? true : this.router.parseUrl('/main/welcome');
  }
}
