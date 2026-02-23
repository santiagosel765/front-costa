import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { mapHttpErrorMessage } from '../utils/api-error.util';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          this.handleHttpError(error);
        }

        return throwError(() => error);
      }),
    );
  }

  private handleHttpError(error: HttpErrorResponse): void {
    if (error.status === 403 && this.isModuleNotLicensed(error.error)) {
      this.message.warning('Módulo no licenciado para este tenant.');
      this.router.navigate(['/main/welcome']);
      return;
    }

    if ([400, 403, 409].includes(error.status)) {
      this.message.error(mapHttpErrorMessage(error));
    }
  }

  private isModuleNotLicensed(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    return (payload as { error?: string }).error === 'MODULE_NOT_LICENSED';
  }
}
