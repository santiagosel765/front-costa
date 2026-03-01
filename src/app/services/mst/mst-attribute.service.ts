import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from './mst.models';

export type AttributeType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'SELECT' | 'MULTISELECT';
export interface AttributeOption { value: string; sortOrder: number; active: boolean; }
export interface MstAttribute { id: string; name: string; code: string; type: AttributeType; required: boolean; searchable: boolean; visible: boolean; options?: AttributeOption[]; active?: boolean; }

@Injectable({ providedIn: 'root' })
export class MstAttributeService {
  private readonly api = inject(ApiService);
  list(query: ListQuery): Observable<WrappedList<MstAttribute>> { return this.api.get<unknown>('/v1/mst/attributes', { params: queryToParams(query) }).pipe(map((r) => mapWrappedList<MstAttribute>(r, query))); }
  create(payload: Partial<MstAttribute>): Observable<MstAttribute> { return this.api.post<unknown>('/v1/mst/attributes', payload).pipe(map((r) => unwrapData<MstAttribute>(r))); }
  update(id: string, payload: Partial<MstAttribute>): Observable<MstAttribute> { return this.api.put<unknown>(`/v1/mst/attributes/${id}`, payload).pipe(map((r) => unwrapData<MstAttribute>(r))); }
  remove(id: string): Observable<void> { return this.api.delete(`/v1/mst/attributes/${id}`).pipe(map(() => void 0)); }
}
