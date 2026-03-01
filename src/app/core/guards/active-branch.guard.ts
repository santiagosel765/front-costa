import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanMatch, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { BranchContextService } from '../services/branch-context.service';

@Injectable({ providedIn: 'root' })
export class ActiveBranchGuard implements CanActivate, CanMatch {
  private readonly router = inject(Router);
  private readonly branchContext = inject(BranchContextService);

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return of(this.validate(state.url));
  }

  canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const segmentPath = segments.map((segment) => segment.path).join('/');
    const routePath = route.path ?? '';
    const suffix = segmentPath || routePath;
    const returnUrl = suffix ? `/main/${suffix}` : '/main/welcome';

    return of(this.validate(returnUrl));
  }

  private validate(returnUrl: string): boolean | UrlTree {
    if (this.branchContext.getActiveBranchId()) {
      return true;
    }

    return this.router.createUrlTree(['/main/org'], {
      queryParams: {
        tab: 'branches',
        returnUrl,
      },
    });
  }
}
