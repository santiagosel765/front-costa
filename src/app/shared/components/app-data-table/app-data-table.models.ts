import { TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';

export type AppTableSortOrder = 'ascend' | 'descend' | null;

export interface TableState {
  q: string;
  status: string | number | null;
  page: number;
  size: number;
  sortField: string | null;
  sortOrder: AppTableSortOrder;
}

export interface TableLoadResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface TableDataSource<T> {
  load(state: TableState): Observable<TableLoadResult<T>>;
}

export interface AppDataTableActionConfig<T> {
  type: 'edit' | 'delete' | 'custom';
  label: string;
  icon?: string;
  danger?: boolean;
  confirmTitle?: string;
  disabled?: (row: T) => boolean;
  tooltip?: string | ((row: T) => string | null);
}

export interface AppDataTableColumn<T> {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  sortField?: string;
  cellType?: 'text' | 'tag' | 'actions' | 'template';
  valueGetter?: (row: T) => string | number | null | undefined;
  tagColor?: (row: T) => string;
  tagText?: (row: T) => string;
  actions?: AppDataTableActionConfig<T>[];
  template?: TemplateRef<{ $implicit: T }>;
}

export interface AppDataTablePageChange {
  pageIndex: number;
  pageSize: number;
}

export interface AppDataTableSortChange {
  sortField: string | null;
  sortOrder: AppTableSortOrder;
}

export interface AppDataTableFilterChange {
  status: string | number | null;
}
