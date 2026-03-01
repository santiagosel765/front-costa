import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogQuery } from '../config/config.models';

export interface OrgLocationFields {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationNotes?: string;
}

export interface OrgBranchDto extends OrgLocationFields {
  code: string;
  name: string;
  active: boolean;
  description?: string;
}

export interface OrgBranchRecord extends OrgBranchDto {
  id: string;
  updatedAt?: string;
  updated_at?: string;
}

function normalizeBranchRecord(record: OrgBranchRecord): OrgBranchRecord {
  return {
    ...record,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

@Injectable({ providedIn: 'root' })
export class OrgBranchService {
  private readonly api = inject(ApiService);

  list(query: CatalogQuery): Observable<PagedResponse<OrgBranchRecord>> {
    return this.api
      .get<ApiResponse<PagedResponse<OrgBranchRecord>> | PagedResponse<OrgBranchRecord>>('/v1/org/branches', {
        params: { page: Math.max(1, query.page), size: query.size, search: query.search ?? '' },
      })
      .pipe(
        map((response) => unwrapApiResponse<PagedResponse<OrgBranchRecord>>(response)),
        map((response) => ({
          data: (response.data ?? []).map(normalizeBranchRecord),
          total: response.total ?? 0,
          page: Math.max(1, response.page ?? 1),
          size: response.size ?? query.size,
          totalPages: response.totalPages ?? 1,
        })),
      );
  }

  create(dto: OrgBranchDto): Observable<OrgBranchRecord> {
    return this.api
      .post<ApiResponse<OrgBranchRecord> | OrgBranchRecord>('/v1/org/branches', dto)
      .pipe(map((response) => normalizeBranchRecord(unwrapApiResponse(response))));
  }

  update(id: string, dto: OrgBranchDto): Observable<OrgBranchRecord> {
    return this.api
      .put<ApiResponse<OrgBranchRecord> | OrgBranchRecord>(`/v1/org/branches/${id}`, dto)
      .pipe(map((response) => normalizeBranchRecord(unwrapApiResponse(response))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/org/branches/${id}`).pipe(map(() => void 0));
  }
}
