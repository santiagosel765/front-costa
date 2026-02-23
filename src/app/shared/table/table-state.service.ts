import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AppTableSortOrder, TableState } from '../components/app-data-table/app-data-table.models';

const DEFAULT_STATE: TableState = {
  q: '',
  status: null,
  page: 1,
  size: 10,
  sortField: null,
  sortOrder: null,
};

@Injectable()
export class TableStateService {
  private readonly stateSubject = new BehaviorSubject<TableState>(DEFAULT_STATE);

  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): TableState {
    return this.stateSubject.value;
  }

  init(route: ActivatedRoute, defaults: Partial<TableState> = {}): void {
    const mergedDefaults = { ...DEFAULT_STATE, ...defaults };
    const nextState = this.parseQueryParams(route.snapshot.queryParams, mergedDefaults);
    this.stateSubject.next(nextState);
  }

  patch(router: Router, patch: Partial<TableState>): void {
    const current = this.snapshot;
    const nextState = this.normalize({ ...current, ...patch });
    if (JSON.stringify(current) === JSON.stringify(nextState)) {
      return;
    }

    this.stateSubject.next(nextState);

    router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: this.toQueryParams(nextState),
      replaceUrl: true,
    });
  }

  private parseQueryParams(queryParams: Params, defaults: TableState): TableState {
    return this.normalize({
      q: (queryParams['q'] as string) ?? defaults.q,
      status: this.parseStatus(queryParams['status'], defaults.status),
      page: Number(queryParams['page'] ?? defaults.page),
      size: Number(queryParams['size'] ?? defaults.size),
      sortField: (queryParams['sortField'] as string) ?? defaults.sortField,
      sortOrder: this.parseSortOrder(queryParams['sortOrder']) ?? defaults.sortOrder,
    });
  }

  private parseStatus(raw: unknown, fallback: string | number | null): string | number | null {
    if (raw === undefined || raw === null || raw === '' || raw === 'null') {
      return fallback;
    }
    if (!Number.isNaN(Number(raw)) && `${raw}`.trim() !== '') {
      return Number(raw);
    }
    return String(raw);
  }

  private parseSortOrder(raw: unknown): AppTableSortOrder {
    return raw === 'ascend' || raw === 'descend' ? raw : null;
  }

  private toQueryParams(state: TableState): Params {
    return {
      q: state.q || null,
      status: state.status ?? null,
      page: state.page,
      size: state.size,
      sortField: state.sortField,
      sortOrder: state.sortOrder,
    };
  }

  private normalize(state: TableState): TableState {
    const size = Number.isFinite(state.size) && state.size > 0 ? Math.floor(state.size) : DEFAULT_STATE.size;
    const page = Number.isFinite(state.page) && state.page > 0 ? Math.floor(state.page) : DEFAULT_STATE.page;

    return {
      q: (state.q ?? '').toString().trim(),
      status: state.status ?? null,
      page,
      size,
      sortField: state.sortField || null,
      sortOrder: state.sortOrder === 'ascend' || state.sortOrder === 'descend' ? state.sortOrder : null,
    };
  }
}
