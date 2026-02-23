import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AuthUserSummary } from '../../../core/models/auth-admin.models';
import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';
import { SessionStore } from '../../../core/state/session.store';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LocalArrayDataSource } from '../../../shared/table/local-array-data-source';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  standalone: true,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  providers: [TableStateService],
  imports: [
    CommonModule,
    NzButtonModule,
    NzTagModule,
    NzCardModule,
    NzIconModule,
    NzToolTipModule,
    PageHeaderComponent,
    AppDataTableComponent,
  ],
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly service = inject(UsersAdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  private readonly sessionStore = inject(SessionStore);
  readonly tableState = inject(TableStateService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('rolesTemplate', { static: true })
  rolesTemplate!: TemplateRef<{ $implicit: AuthUserSummary }>;

  readonly authModuleKey = 'CORE_DE_AUTENTICACION';
  readonly tableRows = signal<AuthUserSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);

  readonly canWrite = this.sessionStore.canWrite(this.authModuleKey);
  readonly writeBlockedMessage = 'Tu plan/rol no permite editar usuarios';

  readonly statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 1 },
    { label: 'Inactivos', value: 0 },
  ];

  columns: AppDataTableColumn<AuthUserSummary>[] = [];

  readonly breadcrumbs = [
    { label: 'Core de Autenticación', link: '/main/auth' },
    { label: 'Usuarios' },
  ];

  private readonly dataSource = new LocalArrayDataSource<AuthUserSummary>({
    searchPredicate: (user, query) => {
      if (!query) {
        return true;
      }
      return (
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.fullName ?? '').toLowerCase().includes(query)
      );
    },
    statusPredicate: (user, status) => {
      if (status === null) {
        return true;
      }
      if (Number(status) === 1) {
        return user.status === 1;
      }
      return user.status !== 1;
    },
    sortAccessor: (user, sortField) => {
      switch (sortField) {
        case 'username':
          return user.username;
        case 'email':
          return user.email;
        case 'fullName':
          return user.fullName ?? '';
        case 'status':
          return user.status;
        default:
          return (user as unknown as Record<string, unknown>)[sortField] as string | number | null | undefined;
      }
    },
  });

  ngOnInit(): void {
    this.columns = this.buildColumns();
    this.tableState.init(this.route, { size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.applyState(state);
    });

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
        this.error.set('No se pudieron cargar los usuarios');
        this.tableRows.set([]);
        this.total.set(0);
        this.message.error('No se pudieron cargar los usuarios');
      },
      complete: () => this.loading.set(false),
    });
  }

  goCreate(): void {
    if (!this.canWrite) {
      this.message.info(this.writeBlockedMessage);
      return;
    }
    this.router.navigate(['/main/auth/users/new']);
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: AuthUserSummary }): void {
    if (event.type === 'edit') {
      this.edit(event.row.id);
      return;
    }

    if (event.type === 'delete') {
      this.remove(event.row.id);
    }
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

  onFilterChange(filter: { status: string | number | null }): void {
    this.tableState.patch(this.router, { status: filter.status, page: 1 });
  }

  getStatusColor(status: number): string {
    return status === 1 ? 'green' : 'red';
  }

  getStatusText(status: number): string {
    return status === 1 ? 'Activo' : 'Inactivo';
  }

  rolesLabel(user: AuthUserSummary): string {
    const roleNames = user.roleNames?.length ? user.roleNames : user.roles;
    if (roleNames && roleNames.length > 0) {
      return roleNames.join(', ');
    }
    if (user.roleName) {
      return user.roleName;
    }
    return 'Sin rol asignado';
  }

  private edit(id: string): void {
    if (!this.canWrite) {
      this.message.info(this.writeBlockedMessage);
      return;
    }
    this.router.navigate(['/main/auth/users', id, 'edit']);
  }

  private remove(id: string): void {
    if (!this.canWrite) {
      this.message.info(this.writeBlockedMessage);
      return;
    }

    this.loading.set(true);
    this.service.delete(id).subscribe({
      next: () => {
        this.message.success('Usuario eliminado');
        this.reload();
      },
      error: () => this.message.error('No se pudo eliminar el usuario'),
      complete: () => this.loading.set(false),
    });
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

  private buildColumns(): AppDataTableColumn<AuthUserSummary>[] {
    return [
      { key: 'username', title: 'Usuario', sortable: true, cellType: 'text' },
      { key: 'email', title: 'Email', sortable: true, cellType: 'text' },
      {
        key: 'fullName',
        title: 'Nombre completo',
        sortable: true,
        valueGetter: (user) => user.fullName || '-',
      },
      {
        key: 'status',
        title: 'Estado',
        sortable: true,
        cellType: 'tag',
        tagColor: (user) => this.getStatusColor(user.status),
        tagText: (user) => this.getStatusText(user.status),
      },
      {
        key: 'roles',
        title: 'Roles',
        cellType: 'template',
        template: this.rolesTemplate,
      },
      {
        key: 'actions',
        title: 'Acciones',
        width: '220px',
        cellType: 'actions',
        actions: [
          {
            type: 'edit',
            label: 'Editar',
            icon: 'edit',
            disabled: () => !this.canWrite,
            tooltip: () => (!this.canWrite ? this.writeBlockedMessage : null),
          },
          {
            type: 'delete',
            label: 'Eliminar',
            icon: 'delete',
            danger: true,
            confirmTitle: '¿Eliminar usuario?',
            disabled: () => !this.canWrite,
            tooltip: () => (!this.canWrite ? this.writeBlockedMessage : null),
          },
        ],
      },
    ];
  }
}
