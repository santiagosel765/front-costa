import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import {
  AppDataTableColumn,
  AppDataTableFilterChange,
  AppDataTablePageChange,
  AppDataTableSortChange,
  AppTableSortOrder,
} from './app-data-table.models';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzDropDownModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule,
  ],
  templateUrl: './app-data-table.component.html',
  styleUrl: './app-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDataTableComponent<T> implements OnInit, OnDestroy, OnChanges {
  @Input() columns: AppDataTableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() total = 0;
  @Input() pageIndex = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() sortField: string | null = null;
  @Input() sortOrder: AppTableSortOrder = null;
  @Input() emptyMessage = 'No hay resultados';
  @Input() showToolbar = true;
  @Input() searchPlaceholder = 'Buscar';
  @Input() showStatusFilter = false;
  @Input() statusOptions: Array<{ label: string; value: string | number | null }> = [
    { label: 'Todos', value: null },
  ];
  @Input() searchValue = '';
  @Input() statusValue: string | number | null = null;

  @Output() readonly pageChange = new EventEmitter<AppDataTablePageChange>();
  @Output() readonly sortChange = new EventEmitter<AppDataTableSortChange>();
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly filterChange = new EventEmitter<AppDataTableFilterChange>();
  @Output() readonly action = new EventEmitter<{ type: 'edit' | 'delete' | 'custom'; row: T }>();

  protected searchInput = '';
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchInput = this.searchValue;
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => this.searchChange.emit(value));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.searchInput = this.searchValue;
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value ?? '');
  }

  onStatusFilterChange(value: string | number | null): void {
    this.filterChange.emit({ status: value ?? null });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageChange.emit({ pageIndex, pageSize: this.pageSize });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageChange.emit({ pageIndex: 1, pageSize });
  }

  onSortOrderChange(column: AppDataTableColumn<T>, order: string | null): void {
    const nextOrder = (order === 'ascend' || order === 'descend' ? order : null) as AppTableSortOrder;
    this.sortChange.emit({
      sortField: nextOrder ? column.sortField || column.key : null,
      sortOrder: nextOrder,
    });
  }

  resolveSortOrder(column: AppDataTableColumn<T>): AppTableSortOrder {
    const field = column.sortField || column.key;
    return this.sortField === field ? this.sortOrder : null;
  }

  triggerAction(type: 'edit' | 'delete' | 'custom', row: T): void {
    this.action.emit({ type, row });
  }

  resolveValue(column: AppDataTableColumn<T>, row: T): string | number {
    const value = column.valueGetter ? column.valueGetter(row) : (row as unknown as Record<string, unknown>)[column.key];
    return value === null || value === undefined || value === '' ? '-' : (value as string | number);
  }

  resolveTooltip(action: { tooltip?: string | ((row: T) => string | null) }, row: T): string | null {
    if (!action.tooltip) {
      return null;
    }
    return typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;
  }


}
