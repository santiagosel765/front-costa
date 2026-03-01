import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from './mst.models';

export interface TaxProfileTax { taxId: string; sortOrder: number; }
export interface MstTaxProfile { id: string; name: string; description?: string; taxes: TaxProfileTax[]; active?: boolean; }

@Injectable({ providedIn: 'root' })
export class MstTaxProfileService {
  private readonly api = inject(ApiService);
  list(query: ListQuery): Observable<WrappedList<MstTaxProfile>> { return this.api.get<unknown>('/v1/mst/tax-profiles', { params: queryToParams(query) }).pipe(map((r) => mapWrappedList<MstTaxProfile>(r, query))); }
  create(payload: Partial<MstTaxProfile>): Observable<MstTaxProfile> { return this.api.post<unknown>('/v1/mst/tax-profiles', payload).pipe(map((r) => unwrapData<MstTaxProfile>(r))); }
  update(id: string, payload: Partial<MstTaxProfile>): Observable<MstTaxProfile> { return this.api.put<unknown>(`/v1/mst/tax-profiles/${id}`, payload).pipe(map((r) => unwrapData<MstTaxProfile>(r))); }
  remove(id: string): Observable<void> { return this.api.delete(`/v1/mst/tax-profiles/${id}`).pipe(map(() => void 0)); }
}
