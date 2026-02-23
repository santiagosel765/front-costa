import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../core/models/api.models';

export interface ProviderPayload {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

export interface ProviderRecord extends ProviderPayload {
  id: string;
  status?: string;
}

export interface ProviderListQuery {
  page: number;
  size: number;
  q?: string;
  sortField?: string | null;
  sortOrder?: 'ascend' | 'descend' | null;
}

@Injectable({ providedIn: 'root' })
export class ProvidersApi {
  private readonly api = inject(ApiService);

  list(query: ProviderListQuery): Observable<PagedResponse<ProviderRecord>> {
    const direction = query.sortOrder === 'ascend' ? 'asc' : query.sortOrder === 'descend' ? 'desc' : null;

    return this.api
      .get<ApiResponse<PagedResponse<ProviderRecord>> | PagedResponse<ProviderRecord>>('/v1/providers', {
        params: {
          page: query.page,
          size: query.size,
          q: query.q ?? '',
          sortField: query.sortField ?? '',
          sortOrder: direction ?? '',
        },
      })
      .pipe(map((payload) => unwrapApiResponse(payload)));
  }

  create(payload: ProviderPayload): Observable<ProviderRecord> {
    return this.api
      .post<ApiResponse<ProviderRecord> | ProviderRecord>('/v1/providers', payload)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  update(id: string, payload: ProviderPayload): Observable<ProviderRecord> {
    return this.api
      .put<ApiResponse<ProviderRecord> | ProviderRecord>(`/v1/providers/${id}`, payload)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  delete(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<null> | null>(`/v1/providers/${id}`)
      .pipe(map(() => void 0));
  }
}
