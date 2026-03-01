import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, PagedResponse, normalizePagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { OrgLocationFields } from './org-branch.service';

export interface OrgWarehouse extends OrgLocationFields {
  id: string;
  branchId: string;
  branchName?: string;
  code: string;
  name: string;
  description?: string;
  warehouseType?: 'MAIN' | 'SALES' | 'RETURNS';
  active: boolean;
  updatedAt?: string;
  updated_at?: string;
  branch?: { id: string; name?: string; code?: string };
}

export interface OrgWarehouseDto extends OrgLocationFields {
  branchId: string;
  code: string;
  name: string;
  description?: string;
  warehouseType?: 'MAIN' | 'SALES' | 'RETURNS';
  active: boolean;
}

export interface OrgWarehouseQuery {
  page: number;
  size: number;
  search?: string;
  branchId?: string;
  active?: boolean;
}

function normalizeWarehouse(record: OrgWarehouse): OrgWarehouse {
  return {
    ...record,
    branchName: record.branchName ?? record.branch?.name,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

@Injectable({ providedIn: 'root' })
export class OrgWarehouseService {
  private readonly api = inject(ApiService);

  list(query: OrgWarehouseQuery): Observable<PagedResponse<OrgWarehouse>> {
    return this.api
      .get<ApiResponse<unknown> | unknown>('/v1/org/warehouses', {
        params: {
          page: Math.max(1, query.page),
          size: query.size,
          search: query.search ?? '',
          ...(query.branchId ? { branchId: query.branchId } : {}),
          ...(typeof query.active === 'boolean' ? { active: query.active } : {}),
        },
      })
      .pipe(
        map((response) => normalizePagedResponse<OrgWarehouse>(unwrapApiResponse(response), { page: query.page, size: query.size })),
        map((response) => ({
          data: response.items.map(normalizeWarehouse),
          total: response.total,
          page: response.page,
          size: response.size,
          totalPages: response.totalPages,
        })),
      );
  }

  create(dto: OrgWarehouseDto): Observable<OrgWarehouse> {
    return this.api
      .post<ApiResponse<OrgWarehouse> | OrgWarehouse>('/v1/org/warehouses', dto)
      .pipe(map((response) => normalizeWarehouse(unwrapApiResponse(response))));
  }

  update(id: string, dto: OrgWarehouseDto): Observable<OrgWarehouse> {
    return this.api
      .put<ApiResponse<OrgWarehouse> | OrgWarehouse>(`/v1/org/warehouses/${id}`, dto)
      .pipe(map((response) => normalizeWarehouse(unwrapApiResponse(response))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/org/warehouses/${id}`).pipe(map(() => void 0));
  }
}
