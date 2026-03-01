import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from '../mst/mst.models';

export interface InvProduct {
  id: string;
  sku?: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE' | 'KIT';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  categoryId?: string;
  brandId?: string;
  uomId?: string;
  taxProfileId?: string;
  basePrice?: number;
  trackStock?: boolean;
  trackLot?: boolean;
  trackSerial?: boolean;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvProductService {
  private readonly api = inject(ApiService);
  list(query: ListQuery): Observable<WrappedList<InvProduct>> { return this.api.get<unknown>('/v1/inv/products', { params: queryToParams(query) }).pipe(map((r) => mapWrappedList<InvProduct>(r, query))); }
  create(payload: Partial<InvProduct>): Observable<InvProduct> { return this.api.post<unknown>('/v1/inv/products', payload).pipe(map((r) => unwrapData<InvProduct>(r))); }
  update(id: string, payload: Partial<InvProduct>): Observable<InvProduct> { return this.api.put<unknown>(`/v1/inv/products/${id}`, payload).pipe(map((r) => unwrapData<InvProduct>(r))); }
  remove(id: string): Observable<void> { return this.api.delete(`/v1/inv/products/${id}`).pipe(map(() => void 0)); }
  updateAttributes(id: string, attributes: Record<string, unknown>): Observable<void> { return this.api.put(`/v1/inv/products/${id}/attributes`, attributes).pipe(map(() => void 0)); }
}
