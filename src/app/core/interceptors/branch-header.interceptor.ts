import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BranchContextService } from '../services/branch-context.service';

@Injectable()
export class BranchHeaderInterceptor implements HttpInterceptor {
  private readonly branchContext = inject(BranchContextService);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!environment.enableBranchHeader) {
      return next.handle(req);
    }

    if (!this.shouldAttachBranchHeader(req.url)) {
      return next.handle(req);
    }

    const branchId = this.branchContext.getActiveBranchId();
    if (!branchId) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: {
          'X-Branch-Id': branchId,
        },
      }),
    );
  }

  private shouldAttachBranchHeader(url: string): boolean {
    if (/^https?:\/\//i.test(url)) {
      return url.startsWith(this.apiBaseUrl);
    }

    return true;
  }
}
