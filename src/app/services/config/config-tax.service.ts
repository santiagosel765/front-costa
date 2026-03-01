import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogQuery, NormalizedListResponse, TaxDto, TaxRecord, normalizeListResponse, readAuditFields, readBooleanField, readNumberField, readStringField } from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigTaxService {
  private readonly api = inject(ApiService);

  list(params: CatalogQuery): Observable<NormalizedListResponse<TaxRecord>> {
    return this.api
      .get<ApiResponse<unknown> | unknown>('/v1/config/taxes', {
        params: { page: params.page, size: params.size, search: params.search ?? '' },
      })
      .pipe(map((response) => normalizeListResponse(unwrapApiResponse(response), (item) => this.mapRecord(item))));
  }

  create(payload: TaxDto): Observable<TaxRecord> {
    return this.api
      .post<ApiResponse<unknown> | unknown>('/v1/config/taxes', payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  update(id: string, payload: TaxDto): Observable<TaxRecord> {
    return this.api
      .put<ApiResponse<unknown> | unknown>(`/v1/config/taxes/${id}`, payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/v1/config/taxes/${id}`).pipe(map(() => void 0));
  }

  private mapRecord(item: unknown): TaxRecord {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: readStringField(source, 'id', 'id') ?? '',
      name: readStringField(source, 'name', 'name') ?? '',
      rate: readNumberField(source, 'rate', 'rate', 0),
      isPercentage: readBooleanField(source, 'isPercentage', 'is_percentage', true),
      active: readBooleanField(source, 'active', 'active', true),
      ...readAuditFields(source),
    };
  }
}
