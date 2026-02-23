import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';

import { ClientPayload, ClientRecord, ClientsApi } from '../../api/clients.api';
import { ModuleAccessService } from '../../core/security/module-access.service';
import { AppDataTableComponent } from '../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../shared/table/table-state.service';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzModalModule,
    NzInputModule,
    NzEmptyModule,
    AppDataTableComponent,
  ],
  templateUrl: './client-shell.component.html',
  styleUrls: ['./client-shell.component.css'],
  providers: [TableStateService],
})
export class ClientShellComponent implements OnInit, OnDestroy {
  private readonly clientsApi = inject(ClientsApi);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly tableState = inject(TableStateService);
  readonly moduleAccess = inject(ModuleAccessService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<ClientRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly isModalVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly moduleNotLicensed = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    document: [''],
    email: ['', [Validators.email]],
    phone: [''],
  });

  readonly columns: AppDataTableColumn<ClientRecord>[] = [
    { key: 'name', title: 'Nombre', sortable: true },
    { key: 'document', title: 'Documento', sortable: true, valueGetter: (row) => row.document ?? '-' },
    { key: 'email', title: 'Email', valueGetter: (row) => row.email ?? '-' },
    { key: 'phone', title: 'Teléfono', valueGetter: (row) => row.phone ?? '-' },
    {
      key: 'actions',
      title: 'Acciones',
      width: '220px',
      cellType: 'actions',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit' },
        { type: 'delete', label: 'Desactivar', icon: 'stop', danger: true, confirmTitle: '¿Desactivar cliente?' },
      ],
    },
  ];

  ngOnInit(): void {
    this.tableState.init(this.route, { size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.load(state);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: ClientRecord }): void {
    if (event.type === 'edit') {
      this.openEdit(event.row);
      return;
    }

    if (event.type === 'delete') {
      this.remove(event.row.id);
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', document: '', email: '', phone: '' });
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as ClientPayload;
    const currentId = this.editingId();
    this.loading.set(true);

    const request$ = currentId
      ? this.clientsApi.update(currentId, payload)
      : this.clientsApi.create(payload);

    request$.subscribe({
      next: () => {
        this.message.success(currentId ? 'Cliente actualizado' : 'Cliente creado');
        this.isModalVisible.set(false);
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/main/welcome']);
  }

  private openEdit(row: ClientRecord): void {
    this.editingId.set(row.id);
    this.form.reset({
      name: row.name ?? '',
      document: row.document ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
    });
    this.isModalVisible.set(true);
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.clientsApi.delete(id).subscribe({
      next: () => {
        this.message.success('Cliente desactivado');
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private load(state: TableState): void {
    this.loading.set(true);
    this.error.set(null);
    this.moduleNotLicensed.set(false);

    this.clientsApi
      .list({
        page: state.page,
        size: state.size,
        q: state.q,
        sortField: state.sortField,
        sortOrder: state.sortOrder,
      })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data ?? []);
          this.total.set(response.total ?? 0);
        },
        error: (err: unknown) => {
          const httpError = err as HttpErrorResponse;
          if (httpError.status === 403 && (httpError.error as { error?: string })?.error === 'MODULE_NOT_LICENSED') {
            this.moduleNotLicensed.set(true);
            this.rows.set([]);
            this.total.set(0);
            return;
          }

          this.error.set('No se pudieron cargar los clientes');
          this.rows.set([]);
          this.total.set(0);
        },
        complete: () => this.loading.set(false),
      });
  }
}
