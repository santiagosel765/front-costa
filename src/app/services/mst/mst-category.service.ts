import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from './mst.models';

export interface MstCategory {
  id: string;
  name: string;
  code?: string;
  parentId?: string | null;
  sortOrder?: number;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MstCategoryService {
  private readonly api = inject(ApiService);

  list(query: ListQuery): Observable<WrappedList<MstCategory>> {
    return this.api.get<unknown>('/v1/mst/categories', { params: queryToParams(query) }).pipe(map((res) => mapWrappedList<MstCategory>(res, query)));
  }

  tree(): Observable<Array<{ title: string; key: string; value: string; children?: unknown[] }>> {
    return this.api.get<unknown>('/v1/mst/categories/tree').pipe(map((res) => unwrapData(res) as Array<{ title: string; key: string; value: string; children?: unknown[] }>));
  }

  create(payload: Partial<MstCategory>): Observable<MstCategory> { return this.api.post<unknown>('/v1/mst/categories', payload).pipe(map((res) => unwrapData<MstCategory>(res))); }
  update(id: string, payload: Partial<MstCategory>): Observable<MstCategory> { return this.api.put<unknown>(`/v1/mst/categories/${id}`, payload).pipe(map((res) => unwrapData<MstCategory>(res))); }
  remove(id: string): Observable<void> { return this.api.delete(`/v1/mst/categories/${id}`).pipe(map(() => void 0)); }
}
