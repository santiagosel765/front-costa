import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';

export interface OrgDocumentNumbering {
  id: string;
  branchId: string;
  branchName?: string;
  documentTypeId: string;
  documentTypeName?: string;
  series: string;
  nextNumber: number;
  padding: number;
  active: boolean;
  updatedAt?: string;
  updated_at?: string;
  branch?: { id: string; name?: string; code?: string };
  documentType?: { id: string; name?: string; code?: string };
}

export interface OrgDocumentNumberingDto {
  branchId: string;
  documentTypeId: string;
  series: string;
  nextNumber: number;
  padding: number;
  active: boolean;
}

export interface OrgDocumentNumberingQuery {
  page: number;
  size: number;
  search?: string;
  branchId?: string;
}

function normalizeNumbering(record: OrgDocumentNumbering): OrgDocumentNumbering {
  return {
    ...record,
    branchName: record.branchName ?? record.branch?.name,
    documentTypeName: record.documentTypeName ?? record.documentType?.name,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

@Injectable({ providedIn: 'root' })
export class OrgDocumentNumberingService {
  private readonly api = inject(ApiService);

  list(query: OrgDocumentNumberingQuery): Observable<PagedResponse<OrgDocumentNumbering>> {
    return this.api
      .get<ApiResponse<PagedResponse<OrgDocumentNumbering>> | PagedResponse<OrgDocumentNumbering>>('/v1/org/document-numbering', {
        params: {
          page: Math.max(1, query.page),
          size: query.size,
          search: query.search ?? '',
          ...(query.branchId ? { branchId: query.branchId } : {}),
        },
      })
      .pipe(
        map((response) => unwrapApiResponse<PagedResponse<OrgDocumentNumbering>>(response)),
        map((response) => ({
          data: (response.data ?? []).map(normalizeNumbering),
          total: response.total ?? 0,
          page: response.page ?? 1,
          size: response.size ?? query.size,
          totalPages: response.totalPages ?? 1,
        })),
      );
  }

  create(dto: OrgDocumentNumberingDto): Observable<OrgDocumentNumbering> {
    return this.api
      .post<ApiResponse<OrgDocumentNumbering> | OrgDocumentNumbering>('/v1/org/document-numbering', dto)
      .pipe(map((response) => normalizeNumbering(unwrapApiResponse(response))));
  }

  update(id: string, dto: OrgDocumentNumberingDto): Observable<OrgDocumentNumbering> {
    return this.api
      .put<ApiResponse<OrgDocumentNumbering> | OrgDocumentNumbering>(`/v1/org/document-numbering/${id}`, dto)
      .pipe(map((response) => normalizeNumbering(unwrapApiResponse(response))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/org/document-numbering/${id}`).pipe(map(() => void 0));
  }
}
