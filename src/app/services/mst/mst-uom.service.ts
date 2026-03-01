import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListQuery, mapWrappedList, queryToParams, unwrapData, WrappedList } from './mst.models';

export interface UomGroup { id: string; name: string; code?: string; active?: boolean; }
export interface UomUnit { id: string; groupId: string; name: string; symbol: string; isBase: boolean; active?: boolean; }
export interface UomConversion { id: string; groupId: string; fromUomId: string; toUomId: string; factor: number; active?: boolean; }

@Injectable({ providedIn: 'root' })
export class MstUomService {
  private readonly api = inject(ApiService);
  listGroups(query: ListQuery): Observable<WrappedList<UomGroup>> { return this.api.get<unknown>('/v1/mst/uom-groups', { params: queryToParams(query) }).pipe(map((res) => mapWrappedList<UomGroup>(res, query))); }
  createGroup(payload: Partial<UomGroup>): Observable<UomGroup> { return this.api.post<unknown>('/v1/mst/uom-groups', payload).pipe(map((res) => unwrapData<UomGroup>(res))); }
  updateGroup(id: string, payload: Partial<UomGroup>): Observable<UomGroup> { return this.api.put<unknown>(`/v1/mst/uom-groups/${id}`, payload).pipe(map((res) => unwrapData<UomGroup>(res))); }
  removeGroup(id: string): Observable<void> { return this.api.delete(`/v1/mst/uom-groups/${id}`).pipe(map(() => void 0)); }

  listUnits(query: ListQuery): Observable<WrappedList<UomUnit>> { return this.api.get<unknown>('/v1/mst/uoms', { params: queryToParams(query) }).pipe(map((res) => mapWrappedList<UomUnit>(res, query))); }
  createUnit(payload: Partial<UomUnit>): Observable<UomUnit> { return this.api.post<unknown>('/v1/mst/uoms', payload).pipe(map((res) => unwrapData<UomUnit>(res))); }
  updateUnit(id: string, payload: Partial<UomUnit>): Observable<UomUnit> { return this.api.put<unknown>(`/v1/mst/uoms/${id}`, payload).pipe(map((res) => unwrapData<UomUnit>(res))); }
  removeUnit(id: string): Observable<void> { return this.api.delete(`/v1/mst/uoms/${id}`).pipe(map(() => void 0)); }

  listConversions(query: ListQuery): Observable<WrappedList<UomConversion>> { return this.api.get<unknown>('/v1/mst/uom-conversions', { params: queryToParams(query) }).pipe(map((res) => mapWrappedList<UomConversion>(res, query))); }
  createConversion(payload: Partial<UomConversion>): Observable<UomConversion> { return this.api.post<unknown>('/v1/mst/uom-conversions', payload).pipe(map((res) => unwrapData<UomConversion>(res))); }
  updateConversion(id: string, payload: Partial<UomConversion>): Observable<UomConversion> { return this.api.put<unknown>(`/v1/mst/uom-conversions/${id}`, payload).pipe(map((res) => unwrapData<UomConversion>(res))); }
  removeConversion(id: string): Observable<void> { return this.api.delete(`/v1/mst/uom-conversions/${id}`).pipe(map(() => void 0)); }
}
