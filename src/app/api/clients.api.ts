import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../core/models/api.models';

export interface ClientPayload {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
}

export interface ClientRecord extends ClientPayload {
  id: string;
  status?: string;
}

export interface ClientListQuery {
  page: number;
  size: number;
  q?: string;
  sortField?: string | null;
  sortOrder?: 'ascend' | 'descend' | null;
}

@Injectable({ providedIn: 'root' })
export class ClientsApi {
  private readonly api = inject(ApiService);

  list(query: ClientListQuery): Observable<PagedResponse<ClientRecord>> {
    const direction = query.sortOrder === 'ascend' ? 'asc' : query.sortOrder === 'descend' ? 'desc' : null;

    return this.api
      .get<ApiResponse<PagedResponse<ClientRecord>> | PagedResponse<ClientRecord>>('/v1/clients', {
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

  create(payload: ClientPayload): Observable<ClientRecord> {
    return this.api
      .post<ApiResponse<ClientRecord> | ClientRecord>('/v1/clients', payload)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  update(id: string, payload: ClientPayload): Observable<ClientRecord> {
    return this.api
      .put<ApiResponse<ClientRecord> | ClientRecord>(`/v1/clients/${id}`, payload)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  delete(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<null> | null>(`/v1/clients/${id}`)
      .pipe(map(() => void 0));
  }
}
