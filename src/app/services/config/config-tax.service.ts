import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { CatalogDto, CatalogQuery, CatalogRecord, normalizeCatalogRecord } from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigTaxService {
  private readonly api = inject(ApiService);

  list(query: CatalogQuery): Observable<PagedResponse<CatalogRecord>> {
    return this.api
      .get<ApiResponse<PagedResponse<CatalogRecord>> | PagedResponse<CatalogRecord>>('/v1/config/taxes', {
        params: { page: query.page, size: query.size, search: query.search ?? '' },
      })
      .pipe(map((response) => unwrapApiResponse(response)), map((response) => ({ ...response, data: (response.data ?? []).map(normalizeCatalogRecord) })));
  }

  create(dto: CatalogDto): Observable<CatalogRecord> {
    return this.api
      .post<ApiResponse<CatalogRecord> | CatalogRecord>('/v1/config/taxes', dto)
      .pipe(map((response) => normalizeCatalogRecord(unwrapApiResponse(response))));
  }

  update(id: string, dto: CatalogDto): Observable<CatalogRecord> {
    return this.api
      .put<ApiResponse<CatalogRecord> | CatalogRecord>(`/v1/config/taxes/${id}`, dto)
      .pipe(map((response) => normalizeCatalogRecord(unwrapApiResponse(response))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/config/taxes/${id}`).pipe(map(() => void 0));
  }
}
