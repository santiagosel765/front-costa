import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ApiResponse,
  PagedResponse,
  normalizePagedResponse,
  unwrapApiResponse,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { OrgBranchRecord } from './org-branch.service';

export interface OrgAssignmentUser {
  id: string;
  username?: string;
  fullName?: string;
  email?: string;
}

export interface OrgAssignmentRecord {
  id: string;
  userId: string;
  branchId: string;
  active: boolean;
  updatedAt?: string;
  updated_at?: string;
  user?: OrgAssignmentUser;
  branch?: OrgBranchRecord;
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

  list(
    query: OrgAssignmentQuery,
  ): Observable<PagedResponse<OrgAssignmentRecord>> {
    const fallback = { page: Math.max(1, query.page), size: query.size };

    return this.api
      .get<ApiResponse<unknown> | unknown>('/v1/org/user-branch-assignments', {
        params: {
          page: fallback.page,
          size: query.size,
          ...(query.userId ? { userId: query.userId } : {}),
          ...(query.branchId ? { branchId: query.branchId } : {}),
        },
      })
      .pipe(
        map((response) =>
          normalizePagedResponse<OrgAssignmentRecord>(response, fallback),
        ),
        map(
          (response) =>
            ({
              data: response.data.map((item) => ({
                ...item,
                updatedAt: item.updatedAt ?? item.updated_at,
              })),
              total: response.total,
              page: response.page,
              size: response.size,
              totalPages: response.totalPages,
            }) satisfies PagedResponse<OrgAssignmentRecord>,
        ),
      );
  }

  create(payload: {
    userId: string;
    branchId: string;
  }): Observable<OrgAssignmentRecord> {
    return this.api
      .post<
        ApiResponse<OrgAssignmentRecord> | OrgAssignmentRecord
      >('/v1/org/user-branch-assignments', payload)
      .pipe(
        map((response) => unwrapApiResponse(response)),
        map((item) => ({
          ...item,
          updatedAt: item.updatedAt ?? item.updated_at,
        })),
      );
  }

  remove(id: string): Observable<void> {
    return this.api
      .delete(`/v1/org/user-branch-assignments/${id}`)
      .pipe(map(() => void 0));
  }
}
