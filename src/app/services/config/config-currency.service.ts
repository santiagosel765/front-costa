import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PagedResponse, unwrapApiResponse } from '../../core/models/api.models';
import { CatalogQuery } from './config.models';

export interface CurrencyDto {
  code: string;
  name: string;
  description?: string;
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

  createCurrency(payload: CurrencyDto): Observable<CurrencyRecord> {
    return this.api
      .post<ApiResponse<CurrencyRecord> | CurrencyRecord>('/v1/config/currencies', payload)
      .pipe(map((response) => this.normalizeRecord(unwrapApiResponse(response))));
  }

  updateCurrency(id: string, payload: CurrencyDto): Observable<CurrencyRecord> {
    return this.api
      .put<ApiResponse<CurrencyRecord> | CurrencyRecord>(`/v1/config/currencies/${id}`, payload)
      .pipe(map((response) => this.normalizeRecord(unwrapApiResponse(response))));
  }

  markFunctional(id: string): Observable<void> {
    return this.api.put(`/v1/config/currencies/${id}/functional`, {}).pipe(map(() => void 0));
  }

  deleteCurrency(id: string): Observable<void> {
    return this.api.delete(`/v1/config/currencies/${id}`).pipe(map(() => void 0));
  }

  create(payload: CurrencyDto): Observable<CurrencyRecord> {
    return this.createCurrency(payload);
  }

  update(id: string, payload: CurrencyDto): Observable<CurrencyRecord> {
    return this.updateCurrency(id, payload);
  }

  remove(id: string): Observable<void> {
    return this.deleteCurrency(id);
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
      description: record.description ?? '',
      symbol: record.symbol ?? '',
      decimals: Number(record.decimals ?? 2),
      isFunctional: record.isFunctional ?? source.is_functional ?? false,
      updatedAt: record.updatedAt ?? source.updated_at,
      active: !!record.active,
    };
  }
}
