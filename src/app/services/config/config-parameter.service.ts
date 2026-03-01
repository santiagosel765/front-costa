import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import {
  CatalogQuery,
  NormalizedListResponse,
  ParameterDto,
  ParameterRecord,
  normalizeListResponse,
  readAuditFields,
  readBooleanField,
  readStringField,
} from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigParameterService {
  private readonly api = inject(ApiService);

  list(params: CatalogQuery): Observable<NormalizedListResponse<ParameterRecord>> {
    return this.api
      .get<ApiResponse<unknown> | unknown>('/v1/config/parameters', {
        params: { page: Math.max(params.page - 1, 0), size: params.size, search: params.search ?? '' },
      })
      .pipe(map((response) => normalizeListResponse(unwrapApiResponse(response), (item) => this.mapRecord(item))));
  }

  create(payload: ParameterDto): Observable<ParameterRecord> {
    return this.api
      .post<ApiResponse<unknown> | unknown>('/v1/config/parameters', payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  update(id: string, payload: ParameterDto): Observable<ParameterRecord> {
    return this.api
      .put<ApiResponse<unknown> | unknown>(`/v1/config/parameters/${id}`, payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/v1/config/parameters/${id}`).pipe(map(() => void 0));
  }

  private mapRecord(item: unknown): ParameterRecord {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: readStringField(source, 'id', 'id') ?? '',
      code: readStringField(source, 'code', 'code') ?? '',
      value: readStringField(source, 'value', 'value') ?? '',
      description: readStringField(source, 'description', 'description'),
      active: readBooleanField(source, 'active', 'active', true),
      ...readAuditFields(source),
    };
  }
}
