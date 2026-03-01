import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { CatalogQuery } from '../config/config.models';

export interface OrgBranchDto {
  code: string;
  name: string;
  active: boolean;
  address?: string;
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
        params: { page: query.page, size: query.size, search: query.search ?? '' },
      })
      .pipe(map((response) => unwrapApiResponse(response)), map((response) => ({ ...response, data: (response.data ?? []).map(normalizeBranchRecord) })));
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
