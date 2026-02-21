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
import { NzMessageService } from 'ng-zorro-antd/message';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { mapHttpErrorMessage } from '../utils/api-error.util';
import { ModulesStore } from '../state/modules.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly modulesStore = inject(ModulesStore);
  private readonly message = inject(NzMessageService);
  private readonly excludedEndpoints = ['/v1/auth/login'];
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requestToSend = this.shouldAttachToken(req.url) ? this.attachToken(req) : req;

    return next.handle(requestToSend).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          this.handleHttpError(error, req.url);
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

  private handleHttpError(error: HttpErrorResponse, requestUrl: string): void {
    if (error.status === 401) {
      this.handleUnauthorized();
      return;
    }

    if (![400, 403, 409].includes(error.status)) {
      return;
    }

    if (this.shouldSkip(requestUrl)) {
      return;
    }

    this.message.error(mapHttpErrorMessage(error));
  }

  private handleUnauthorized(): void {
    this.authService.logout();
    this.modulesStore.reset();
    this.router.navigate(['/login']);
  }
}
