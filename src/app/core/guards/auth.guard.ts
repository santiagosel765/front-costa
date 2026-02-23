import { Injectable, inject } from '@angular/core';
import { CanActivate, CanMatch, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';

import { AuthContextService } from '../services/auth-context.service';
import { SessionStore } from '../state/session.store';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanMatch {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly authContextService = inject(AuthContextService);

  canActivate(): Observable<boolean | UrlTree> {
    return this.validateAuth();
  }

  canMatch(_route: Route, _segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return this.validateAuth();
  }

  private validateAuth(): Observable<boolean | UrlTree> {
    if (this.sessionStore.isTokenExpired()) {
      this.sessionStore.clearSession(false);
      return of(this.router.parseUrl('/auth/login'));
    }

    if (this.sessionStore.hasContextLoaded()) {
      return of(true);
    }

    return this.authContextService.loadContext().pipe(
      map(() => true),
      catchError(() => {
        this.sessionStore.clearSession(false);
        return of(this.router.parseUrl('/auth/login'));
      }),
    );
  }
}
