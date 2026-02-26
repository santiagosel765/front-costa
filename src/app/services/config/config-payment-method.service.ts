import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { CatalogDto, CatalogQuery, CatalogRecord } from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigPaymentMethodService {
  private readonly api = inject(ApiService);

  list(query: CatalogQuery): Observable<PagedResponse<CatalogRecord>> {
    return this.api
      .get<ApiResponse<PagedResponse<CatalogRecord>> | PagedResponse<CatalogRecord>>('/v1/config/payment-methods', {
        params: { page: query.page, size: query.size, search: query.search ?? '' },
      })
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  create(dto: CatalogDto): Observable<CatalogRecord> {
    return this.api
      .post<ApiResponse<CatalogRecord> | CatalogRecord>('/v1/config/payment-methods', dto)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  update(id: string, dto: CatalogDto): Observable<CatalogRecord> {
    return this.api
      .put<ApiResponse<CatalogRecord> | CatalogRecord>(`/v1/config/payment-methods/${id}`, dto)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/config/payment-methods/${id}`).pipe(map(() => void 0));
  }
}
