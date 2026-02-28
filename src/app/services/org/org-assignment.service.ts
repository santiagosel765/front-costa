import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogRecord, normalizeCatalogRecord } from '../config/config.models';

export interface OrgAssignmentRecord {
  id: string;
  userId: string;
  branchId: string;
  active: boolean;
  updatedAt?: string;
}

export interface OrgAssignmentQuery {
  page: number;
  size: number;
  userId?: string;
  branchId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrgAssignmentService {
  private readonly api = inject(ApiService);

  list(query: OrgAssignmentQuery): Observable<PagedResponse<OrgAssignmentRecord>> {
    return this.api
      .get<ApiResponse<PagedResponse<OrgAssignmentRecord>> | PagedResponse<OrgAssignmentRecord>>('/v1/org/user-branch-assignments', {
        params: {
          page: query.page,
          size: query.size,
          userId: query.userId ?? '',
          branchId: query.branchId ?? '',
        },
      })
      .pipe(
        map((response) => unwrapApiResponse(response)),
        map((response) => ({
          ...response,
          data: (response.data ?? []).map((item) => {
            const normalized = normalizeCatalogRecord(item as unknown as CatalogRecord);
            return {
              ...item,
              updatedAt: normalized.updatedAt,
            };
          }),
        })),
      );
  }

  create(payload: { userId: string; branchId: string }): Observable<OrgAssignmentRecord> {
    return this.api
      .post<ApiResponse<OrgAssignmentRecord> | OrgAssignmentRecord>('/v1/org/user-branch-assignments', payload)
      .pipe(
        map((response) => unwrapApiResponse(response)),
        map((item) => {
          const normalized = normalizeCatalogRecord(item as unknown as CatalogRecord);
          return {
            ...item,
            updatedAt: normalized.updatedAt,
          };
        }),
      );
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/org/user-branch-assignments/${id}`).pipe(map(() => void 0));
  }
}
