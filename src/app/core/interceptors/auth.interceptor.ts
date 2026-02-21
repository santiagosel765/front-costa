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
import { AuthService } from '../../services/auth.service';
import { ModulesStore } from '../state/modules.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly modulesStore = inject(ModulesStore);
  private readonly excludedEndpoints = ['/v1/auth/login', '/v1/auth/register'];
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
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
    const token = this.getToken();
    if (!token) {
      return req;
    }

    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private getToken(): string | null {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  }

  private handleUnauthorized(): void {
    this.authService.logout();
    this.modulesStore.reset();
    this.router.navigate(['/login']);
  }
}
