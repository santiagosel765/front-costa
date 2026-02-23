import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { SessionStore } from '../state/session.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly excludedEndpoints = ['/v1/auth/login'];
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.shouldSkip(req.url) && this.sessionStore.isTokenExpired()) {
      this.handleUnauthorized();
      return throwError(() => new Error('Session expired'));
    }

    const requestToSend = this.shouldAttachToken(req.url) ? this.attachToken(req) : req;

    return next.handle(requestToSend).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.handleUnauthorized();
        }

        return throwError(() => error);
      }),
    );
  }

  private shouldSkip(url: string): boolean {
    return this.excludedEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private shouldAttachToken(url: string): boolean {
    if (this.shouldSkip(url)) {
      return false;
    }

    if (/^https?:\/\//i.test(url)) {
      return url.startsWith(this.apiBaseUrl);
    }

    return true;
  }

  private attachToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.sessionStore.getToken();
    if (!token) {
      return req;
    }

    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handleUnauthorized(): void {
    this.sessionStore.clearSession(false);
    this.router.navigate(['/auth/login']);
  }
}
