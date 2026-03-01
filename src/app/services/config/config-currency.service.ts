import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { CatalogQuery } from './config.models';

export interface CurrencyDto {
  code: string;
  name: string;
  symbol?: string;
  decimals?: number;
  isFunctional?: boolean;
  active: boolean;
}

export interface CurrencyRecord extends CurrencyDto {
  id: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigCurrencyService {
  private readonly api = inject(ApiService);

  list(query: CatalogQuery): Observable<PagedResponse<CurrencyRecord>> {
    return this.api
      .get<ApiResponse<PagedResponse<CurrencyRecord>> | PagedResponse<CurrencyRecord>>('/v1/config/currencies', {
        params: { page: query.page, size: query.size, search: query.search ?? '' },
      })
      .pipe(
        map((response) => unwrapApiResponse(response)),
        map((response) => ({
          ...response,
          data: this.extractListData(response).map((record) => this.normalizeRecord(record)),
        })),
      );
  }

  create(dto: CurrencyDto): Observable<CurrencyRecord> {
    return this.api
      .post<ApiResponse<CurrencyRecord> | CurrencyRecord>('/v1/config/currencies', dto)
      .pipe(map((response) => this.normalizeRecord(unwrapApiResponse(response))));
  }

  update(id: string, dto: CurrencyDto): Observable<CurrencyRecord> {
    return this.api
      .put<ApiResponse<CurrencyRecord> | CurrencyRecord>(`/v1/config/currencies/${id}`, dto)
      .pipe(map((response) => this.normalizeRecord(unwrapApiResponse(response))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/v1/config/currencies/${id}`).pipe(map(() => void 0));
  }

  private extractListData(response: PagedResponse<CurrencyRecord>): CurrencyRecord[] {
    const nestedData = (response.data as unknown as { data?: CurrencyRecord[] } | CurrencyRecord[]) as
      | { data?: CurrencyRecord[] }
      | CurrencyRecord[];

    if (Array.isArray(nestedData)) {
      return nestedData;
    }

    return nestedData.data ?? [];
  }

  private normalizeRecord(record: CurrencyRecord): CurrencyRecord {
    const source = record as CurrencyRecord & { updated_at?: string; is_functional?: boolean };

    return {
      ...record,
      code: (record.code ?? '').trim().toUpperCase(),
      name: (record.name ?? '').trim(),
      symbol: record.symbol ?? '',
      decimals: Number(record.decimals ?? 2),
      isFunctional: record.isFunctional ?? source.is_functional ?? false,
      updatedAt: record.updatedAt ?? source.updated_at,
      active: !!record.active,
    };
  }
}
