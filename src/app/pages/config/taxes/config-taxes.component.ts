import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { Subject, takeUntil } from 'rxjs';

import { mapHttpErrorMessage } from '../../../core/utils/api-error.util';
import { TaxRecord } from '../../../services/config/config.models';
import { ConfigTaxService } from '../../../services/config/config-tax.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  selector: 'app-config-taxes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSwitchModule,
    AppDataTableComponent,
  ],
  templateUrl: './config-taxes.component.html',
  styleUrls: ['./config-taxes.component.css'],
  providers: [TableStateService],
})
export class ConfigTaxesComponent implements OnInit, OnDestroy {
  private readonly service = inject(ConfigTaxService);
  private readonly tableState = inject(TableStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<TaxRecord[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isModalVisible = signal(false);
  readonly editingRow = signal<TaxRecord | null>(null);

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    rate: this.fb.nonNullable.control(12, [Validators.required, Validators.min(0), Validators.max(100)]),
    active: this.fb.nonNullable.control(true),
  });

  readonly columns: AppDataTableColumn<TaxRecord>[] = [
    { key: 'name', title: 'Nombre', sortable: true },
    { key: 'rate', title: 'Tasa', valueGetter: (row) => `${Number(row.rate ?? 0).toFixed(2)}%` },
    {
      key: 'active',
      title: 'Estado',
      cellType: 'tag',
      tagColor: (row) => (row.active ? 'green' : 'red'),
      tagText: (row) => (row.active ? 'Activo' : 'Inactivo'),
    },
    { key: 'updatedAt', title: 'Actualizado', valueGetter: (row) => this.formatDate(row.updatedAt) },
    {
      key: 'actions',
      title: 'Acciones',
      width: '220px',
      cellType: 'actions',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit' },
        { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true },
      ],
    },
  ];

  get state() {
    return this.tableState.snapshot;
  }

  ngOnInit(): void {
    this.tableState.init(this.route, { size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => this.load(state));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSearchChange(search: string): void {
    this.tableState.patch(this.router, { q: search, page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: TaxRecord }): void {
    if (event.type === 'edit') {
      this.openEdit(event.row);
      return;
    }

    if (event.type === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingRow.set(null);
    this.resetForm();
    this.isModalVisible.set(true);
  }

  openEdit(row: TaxRecord): void {
    this.editingRow.set(row);
    this.form.reset({
      name: row.name ?? '',
      rate: Number(row.rate ?? 0),
      active: !!row.active,
    });
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
    this.editingRow.set(null);
    this.resetForm();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.form.controls.name.value.trim(),
      rate: Number(this.form.controls.rate.value ?? 0),
      isPercentage: true,
      active: !!this.form.controls.active.value,
    };

    const editing = this.editingRow();
    this.saving.set(true);

    const request$ = editing ? this.service.update(editing.id, payload) : this.service.create(payload);
    request$.subscribe({
      next: () => {
        this.message.success(editing ? 'Impuesto actualizado' : 'Impuesto creado');
        this.closeModal();
        this.tableState.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.message.error(mapHttpErrorMessage(error));
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  createFirst(): void {
    this.openCreate();
  }

  private confirmDelete(row: TaxRecord): void {
    this.modal.confirm({
      nzTitle: '¿Eliminar impuesto?',
      nzContent: `¿Deseas eliminar el impuesto ${row.name}?`,
      nzOkDanger: true,
      nzOnOk: () =>
        new Promise<void>((resolve) => {
          this.loading.set(true);
          this.service.delete(row.id).subscribe({
            next: () => {
              this.message.success('Impuesto eliminado');
              this.tableState.reload();
              resolve();
            },
            error: (error: HttpErrorResponse) => {
              this.message.error(mapHttpErrorMessage(error));
              this.loading.set(false);
              resolve();
            },
            complete: () => this.loading.set(false),
          });
        }),
    });
  }

  private load(state: TableState): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list({ page: state.page, size: state.size, search: state.q }).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.total.set(response.total ?? 0);
      },
      error: () => {
        this.rows.set([]);
        this.total.set(0);
        this.error.set('No se pudieron cargar los impuestos');
      },
      complete: () => this.loading.set(false),
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      rate: 12,
      active: true,
    });
    this.form.markAsPristine();
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('es-GT');
  }
}
