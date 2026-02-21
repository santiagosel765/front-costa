import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { normalizeModuleName } from '../constants/module-route-map';
import { ModulesService } from '../services/modules.service';

@Injectable({
  providedIn: 'root',
})
export class ModuleGuard implements CanActivate {
  private readonly modulesService = inject(ModulesService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const moduleKeyRaw = route.data?.['moduleKey'] as string | undefined;
    const moduleKey = normalizeModuleName(moduleKeyRaw) ?? moduleKeyRaw?.replace(/\s+/g, '_').toUpperCase();

    if (!moduleKey) {
      return of(true);
    }

    return this.modulesService.getAllModules().pipe(
      map((modules) => {
        const activeKeys = new Set(
          modules
            .filter((module) => module.status === 1)
            .map((module) => normalizeModuleName(module.name) ?? module.name?.toUpperCase() ?? '')
            .filter((key) => !!key),
        );

        return activeKeys.has(moduleKey);
      }),
      map((hasAccess) => (hasAccess ? true : this.router.parseUrl('/main/welcome'))),
      catchError(() => of(this.router.parseUrl('/main/welcome'))),
    );
  }
}
