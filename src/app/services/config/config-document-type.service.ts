import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import {
  CatalogQuery,
  DocumentTypeDto,
  DocumentTypeRecord,
  NormalizedListResponse,
  normalizeListResponse,
  readAuditFields,
  readBooleanField,
  readStringField,
} from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigDocumentTypeService {
  private readonly api = inject(ApiService);

  list(params: CatalogQuery): Observable<NormalizedListResponse<DocumentTypeRecord>> {
    return this.api
      .get<ApiResponse<unknown> | unknown>('/v1/config/document-types', {
        params: { page: params.page, size: params.size, search: params.search ?? '' },
      })
      .pipe(map((response) => normalizeListResponse(unwrapApiResponse(response), (item) => this.mapRecord(item))));
  }

  create(payload: DocumentTypeDto): Observable<DocumentTypeRecord> {
    return this.api
      .post<ApiResponse<unknown> | unknown>('/v1/config/document-types', payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  update(id: string, payload: DocumentTypeDto): Observable<DocumentTypeRecord> {
    return this.api
      .put<ApiResponse<unknown> | unknown>(`/v1/config/document-types/${id}`, payload)
      .pipe(map((response) => this.mapRecord(unwrapApiResponse(response))));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/v1/config/document-types/${id}`).pipe(map(() => void 0));
  }

  private mapRecord(item: unknown): DocumentTypeRecord {
    const source = (item ?? {}) as Record<string, unknown>;
    return {
      id: readStringField(source, 'id', 'id') ?? '',
      code: readStringField(source, 'code', 'code') ?? '',
      name: readStringField(source, 'name', 'name') ?? '',
      description: readStringField(source, 'description', 'description'),
      active: readBooleanField(source, 'active', 'active', true),
      ...readAuditFields(source),
    };
  }
}
