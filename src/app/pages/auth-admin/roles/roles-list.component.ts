import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthRoleSummary } from '../../../core/models/auth-admin.models';
import { RolesAdminService } from '../../../core/services/auth-admin/roles-admin.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LocalArrayDataSource } from '../../../shared/table/local-array-data-source';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  standalone: true,
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css'],
  providers: [TableStateService],
  imports: [CommonModule, NzButtonModule, NzCardModule, NzIconModule, PageHeaderComponent, AppDataTableComponent],
})
export class RolesListComponent implements OnInit, OnDestroy {
  private readonly service = inject(RolesAdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  readonly tableState = inject(TableStateService);
  private readonly destroy$ = new Subject<void>();

  readonly tableRows = signal<AuthRoleSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);

  readonly breadcrumbs = [
    { label: 'Core de Autenticación', link: '/main/auth' },
    { label: 'Roles' },
  ];

  readonly columns: AppDataTableColumn<AuthRoleSummary>[] = [
    { key: 'name', title: 'Rol', sortable: true },
    {
      key: 'description',
      title: 'Descripción',
      sortable: true,
      valueGetter: (role) => role.description || 'Sin descripción',
    },
    {
      key: 'status',
      title: 'Estado',
      sortable: true,
      cellType: 'tag',
      tagColor: (role) => this.getStatusColor(role.status),
      tagText: (role) => (role.status === 1 ? 'Activo' : 'Inactivo'),
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '180px',
      cellType: 'actions',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit' },
        {
          type: 'delete',
          label: 'Eliminar',
          icon: 'delete',
          danger: true,
          confirmTitle: '¿Eliminar rol?',
        },
      ],
    },
  ];

  private readonly dataSource = new LocalArrayDataSource<AuthRoleSummary>({
    searchPredicate: (role, query) => {
      if (!query) {
        return true;
      }
      return role.name.toLowerCase().includes(query) || (role.description ?? '').toLowerCase().includes(query);
    },
    sortAccessor: (role, sortField) => {
      switch (sortField) {
        case 'name':
          return role.name;
        case 'description':
          return role.description ?? '';
        case 'status':
          return role.status;
        default:
          return (role as unknown as Record<string, unknown>)[sortField] as string | number | null | undefined;
      }
    },
  });

  ngOnInit(): void {
    this.tableState.init(this.route, { size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => this.applyState(state));
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list().subscribe({
      next: (data) => {
        this.dataSource.setData(data ?? []);
        this.applyState(this.tableState.snapshot);
      },
      error: () => {
        this.error.set('No se pudieron cargar los roles');
        this.tableRows.set([]);
        this.total.set(0);
        this.message.error('No se pudieron cargar los roles');
      },
      complete: () => this.loading.set(false),
    });
  }

  goCreate(): void {
    this.router.navigate(['/main/auth/roles/new']);
  }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSortChange(change: { sortField: string | null; sortOrder: 'ascend' | 'descend' | null }): void {
    this.tableState.patch(this.router, { sortField: change.sortField, sortOrder: change.sortOrder, page: 1 });
  }

  onSearchChange(q: string): void {
    this.tableState.patch(this.router, { q, page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: AuthRoleSummary }): void {
    if (event.type === 'edit') {
      this.router.navigate(['/main/auth/roles', event.row.id, 'edit']);
      return;
    }

    if (event.type === 'delete') {
      this.loading.set(true);
      this.service.delete(event.row.id).subscribe({
        next: () => {
          this.message.success('Rol eliminado');
          this.reload();
        },
        error: () => this.message.error('No se pudo eliminar el rol'),
        complete: () => this.loading.set(false),
      });
    }
  }

  getStatusColor(status: number): string {
    return status === 1 ? 'green' : 'red';
  }

  private applyState(state: TableState): void {
    this.dataSource.load(state).subscribe((result) => {
      this.tableRows.set(result.items);
      this.total.set(result.total);

      if (result.page !== state.page) {
        this.tableState.patch(this.router, { page: result.page });
      }
    });
  }
}
