import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { Subject, takeUntil } from 'rxjs';

import { mapHttpErrorMessage } from '../../../core/utils/api-error.util';
import { ParameterRecord } from '../../../services/config/config.models';
import { ConfigParameterService } from '../../../services/config/config-parameter.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  selector: 'app-config-parameters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule, NzModalModule, NzSwitchModule, AppDataTableComponent],
  templateUrl: './config-parameters.component.html',
  styleUrls: ['./config-parameters.component.css'],
  providers: [TableStateService],
})
export class ConfigParametersComponent implements OnInit, OnDestroy {
  private readonly service = inject(ConfigParameterService);
  private readonly tableState = inject(TableStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<ParameterRecord[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isModalVisible = signal(false);
  readonly editingRow = signal<ParameterRecord | null>(null);

  readonly form = this.fb.group({
    code: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    value: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    active: this.fb.nonNullable.control(true),
  });

  readonly columns: AppDataTableColumn<ParameterRecord>[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'value', title: 'Valor', valueGetter: (row) => row.value || '-' },
    { key: 'description', title: 'Descripción', valueGetter: (row) => row.description || '-' },
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

  onCodeBlur(): void {
    const value = this.form.controls.code.value.trim().toUpperCase();
    this.form.controls.code.setValue(value);
  }

  openCreate(): void {
    this.editingRow.set(null);
    this.resetForm();
    this.isModalVisible.set(true);
  }

  openEdit(row: ParameterRecord): void {
    this.editingRow.set(row);
    this.form.reset({
      code: row.code ?? '',
      value: row.value ?? '',
      description: row.description ?? '',
      active: !!row.active,
    });
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
    this.editingRow.set(null);
    this.resetForm();
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: ParameterRecord }): void {
    if (event.type === 'edit') {
      this.openEdit(event.row);
      return;
    }

    if (event.type === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.onCodeBlur();

    const payload = {
      code: this.form.controls.code.value.trim().toUpperCase(),
      value: this.form.controls.value.value.trim(),
      description: this.form.controls.description.value.trim(),
      active: !!this.form.controls.active.value,
    };

    const editing = this.editingRow();
    this.saving.set(true);

    const request$ = editing ? this.service.update(editing.id, payload) : this.service.create(payload);
    request$.subscribe({
      next: () => {
        this.message.success(editing ? 'Parámetro actualizado' : 'Parámetro creado');
        this.closeModal();
        this.loadParameters();
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

  private confirmDelete(row: ParameterRecord): void {
    this.modal.confirm({
      nzTitle: '¿Eliminar parámetro?',
      nzContent: `¿Deseas eliminar el parámetro ${row.code}?`,
      nzOkDanger: true,
      nzOnOk: () =>
        new Promise<void>((resolve) => {
          this.loading.set(true);
          this.service.delete(row.id).subscribe({
            next: () => {
              this.message.success('Parámetro eliminado');
              this.loadParameters();
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

  private loadParameters(): void {
    this.load(this.tableState.snapshot);
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
        this.error.set('No se pudieron cargar los parámetros');
      },
      complete: () => this.loading.set(false),
    });
  }

  private resetForm(): void {
    this.form.reset({
      code: '',
      value: '',
      description: '',
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
