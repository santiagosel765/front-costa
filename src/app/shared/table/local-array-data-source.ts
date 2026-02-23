import { Observable, of } from 'rxjs';

import {
  TableDataSource,
  TableLoadResult,
  TableState,
} from '../components/app-data-table/app-data-table.models';

export interface LocalArrayDataSourceConfig<T> {
  searchPredicate?: (item: T, query: string) => boolean;
  statusPredicate?: (item: T, status: string | number | null) => boolean;
  sortAccessor?: (item: T, sortField: string) => string | number | null | undefined;
}

/**
 * Adapter for client-side tables using local arrays.
 * To migrate to backend pagination, implement TableDataSource<T> with an API call
 * returning { items, total } based on the same TableState contract.
 */
export class LocalArrayDataSource<T> implements TableDataSource<T> {
  private source: T[] = [];

  constructor(private readonly config: LocalArrayDataSourceConfig<T> = {}) {}

  setData(data: T[]): void {
    this.source = [...data];
  }

  load(state: TableState): Observable<TableLoadResult<T>> {
    const filtered = this.applyFilters(this.source, state);
    const sorted = this.applySort(filtered, state);

    const total = sorted.length;
    const maxPage = total > 0 ? Math.ceil(total / state.size) : 1;
    const page = Math.min(Math.max(state.page, 1), maxPage);
    const start = (page - 1) * state.size;
    const end = start + state.size;

    return of({
      items: sorted.slice(start, end),
      total,
      page,
      size: state.size,
    });
  }

  private applyFilters(items: T[], state: TableState): T[] {
    const query = state.q.toLowerCase();

    return items.filter((item) => {
      const searchPass = this.config.searchPredicate ? this.config.searchPredicate(item, query) : true;
      const statusPass = this.config.statusPredicate ? this.config.statusPredicate(item, state.status) : true;
      return searchPass && statusPass;
    });
  }

  private applySort(items: T[], state: TableState): T[] {
    if (!state.sortField || !state.sortOrder) {
      return [...items];
    }

    const direction = state.sortOrder === 'ascend' ? 1 : -1;
    return [...items].sort((a, b) => {
      const left = this.resolveSortValue(a, state.sortField!);
      const right = this.resolveSortValue(b, state.sortField!);

      if (left === right) {
        return 0;
      }
      if (left === null || left === undefined) {
        return -1 * direction;
      }
      if (right === null || right === undefined) {
        return 1 * direction;
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }

      return `${left}`.localeCompare(`${right}`) * direction;
    });
  }

  private resolveSortValue(item: T, field: string): string | number | null | undefined {
    if (this.config.sortAccessor) {
      return this.config.sortAccessor(item, field);
    }
    return (item as unknown as Record<string, unknown>)[field] as string | number | null | undefined;
  }
}
