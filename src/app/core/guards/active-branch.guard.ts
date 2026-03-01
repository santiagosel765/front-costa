import { Injectable, inject } from '@angular/core';
import { CanActivate, CanMatch, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { BranchContextService } from '../services/branch-context.service';

@Injectable({ providedIn: 'root' })
export class ActiveBranchGuard implements CanActivate, CanMatch {
  private readonly router = inject(Router);
  private readonly branchContext = inject(BranchContextService);

  canActivate(): Observable<boolean | UrlTree> {
    return of(this.validate());
  }

  canMatch(_route: Route, _segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return of(this.validate());
  }

  private validate(): boolean | UrlTree {
    return this.branchContext.getActiveBranchId() ? true : this.router.parseUrl('/main/org?tab=branches');
  }
}
