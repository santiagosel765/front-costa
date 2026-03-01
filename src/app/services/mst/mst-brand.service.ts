import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from './mst.models';

export interface MstBrand { id: string; name: string; code?: string; active?: boolean; }

@Injectable({ providedIn: 'root' })
export class MstBrandService {
  private readonly api = inject(ApiService);
  list(query: ListQuery): Observable<WrappedList<MstBrand>> { return this.api.get<unknown>('/v1/mst/brands', { params: queryToParams(query) }).pipe(map((res) => mapWrappedList<MstBrand>(res, query))); }
  create(payload: Partial<MstBrand>): Observable<MstBrand> { return this.api.post<unknown>('/v1/mst/brands', payload).pipe(map((res) => unwrapData<MstBrand>(res))); }
  update(id: string, payload: Partial<MstBrand>): Observable<MstBrand> { return this.api.put<unknown>(`/v1/mst/brands/${id}`, payload).pipe(map((res) => unwrapData<MstBrand>(res))); }
  remove(id: string): Observable<void> { return this.api.delete(`/v1/mst/brands/${id}`).pipe(map(() => void 0)); }
}
