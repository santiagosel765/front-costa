import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
import { ConfigCurrencyService, CurrencyRecord } from '../../../services/config/config-currency.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  selector: 'app-config-currencies',
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
  templateUrl: './config-currencies.component.html',
  styleUrl: './config-currencies.component.css',
  providers: [TableStateService],
})
export class ConfigCurrenciesComponent implements OnInit, OnDestroy {
  private readonly service = inject(ConfigCurrencyService);
  private readonly tableState = inject(TableStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<CurrencyRecord[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isModalVisible = signal(false);
  readonly editingRow = signal<CurrencyRecord | null>(null);

  readonly form = this.fb.group({
    code: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(10)]),
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.nonNullable.control(''),
    symbol: this.fb.nonNullable.control('', [Validators.maxLength(5)]),
    decimals: this.fb.nonNullable.control(2, [Validators.required, Validators.min(0), Validators.max(6)]),
    isFunctional: this.fb.nonNullable.control(false),
    active: this.fb.nonNullable.control(true),
  });

  readonly columns: AppDataTableColumn<CurrencyRecord>[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'name', title: 'Nombre', sortable: true },
    { key: 'symbol', title: 'Símbolo', valueGetter: (row) => row.symbol || '-' },
    { key: 'decimals', title: 'Decimales', valueGetter: (row) => row.decimals ?? 2 },
    {
      key: 'isFunctional',
      title: 'Funcional',
      cellType: 'tag',
      tagColor: (row) => (row.isFunctional ? 'gold' : 'default'),
      tagText: (row) => (row.isFunctional ? 'Funcional' : 'No funcional'),
    },
    {
      key: 'active',
      title: 'Activo',
      cellType: 'tag',
      tagColor: (row) => (row.active ? 'green' : 'red'),
      tagText: (row) => (row.active ? 'Activo' : 'Inactivo'),
    },
    { key: 'updatedAt', title: 'Actualizado', valueGetter: (row) => this.formatDate(row.updatedAt) },
    {
      key: 'actions',
      title: 'Acciones',
      width: '320px',
      cellType: 'actions',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit' },
        { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true },
        {
          type: 'custom',
          label: 'Marcar funcional',
          disabled: (row) => !!row.isFunctional,
          tooltip: (row) => (row.isFunctional ? 'Esta moneda ya es funcional' : null),
        },
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

  openCreate(): void {
    this.editingRow.set(null);
    this.resetForm();
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
    this.editingRow.set(null);
    this.resetForm();
  }

  openEdit(row: CurrencyRecord): void {
    this.form.get('code')?.setErrors(null);
    this.editingRow.set(row);
    this.form.reset({
      code: row.code ?? '',
      name: row.name ?? '',
      description: row.description ?? '',
      symbol: row.symbol ?? '',
      decimals: row.decimals ?? 2,
      isFunctional: !!row.isFunctional,
      active: !!row.active,
    });
    this.isModalVisible.set(true);
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: CurrencyRecord }): void {
    if (event.type === 'edit') {
      this.openEdit(event.row);
      return;
    }

    if (event.type === 'delete') {
      this.confirmDelete(event.row);
      return;
    }

    this.markAsFunctional(event.row.id);
  }

  onCodeBlur(): void {
    const value = (this.form.controls.code.value ?? '').toString().trim().toUpperCase();
    this.form.controls.code.setValue(value);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.onCodeBlur();
    this.form.get('code')?.setErrors(null);

    const payload = {
      ...this.form.getRawValue(),
      code: this.form.controls.code.value.trim().toUpperCase(),
      name: this.form.controls.name.value.trim(),
      description: this.form.controls.description.value.trim(),
      symbol: this.form.controls.symbol.value.trim(),
      decimals: Number(this.form.controls.decimals.value ?? 2),
    };

    const editing = this.editingRow();
    this.saving.set(true);

    const request$ = editing ? this.service.updateCurrency(editing.id, payload) : this.service.createCurrency(payload);
    request$.subscribe({
      next: () => {
        this.message.success(editing ? 'Moneda actualizada' : 'Moneda creada');
        this.isModalVisible.set(false);
        this.resetForm();
        this.loadCurrencies();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          if (this.isDuplicateCodeConflict(error)) {
            this.form.controls.code.setErrors({ duplicate: true });
            this.form.controls.code.markAsTouched();
          }
          this.message.warning(mapHttpErrorMessage(error));
        } else {
          this.message.error(mapHttpErrorMessage(error));
        }
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  createFirstCurrency(): void {
    this.openCreate();
  }

  private confirmDelete(row: CurrencyRecord): void {
    this.modal.confirm({
      nzTitle: '¿Eliminar moneda?',
      nzContent: `¿Deseas eliminar la moneda ${row.code}? (Esto la desactivará)`,
      nzOkDanger: true,
      nzOnOk: () =>
        new Promise<void>((resolve) => {
          this.loading.set(true);
          this.service.deleteCurrency(row.id).subscribe({
            next: () => {
              this.message.success('Moneda eliminada');
              this.loadCurrencies();
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

  private markAsFunctional(id: string): void {
    this.loading.set(true);
    this.service.markFunctional(id).subscribe({
      next: () => {
        this.message.success('Moneda funcional actualizada');
        this.loadCurrencies();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          this.message.warning(mapHttpErrorMessage(error));
        } else {
          this.message.error(mapHttpErrorMessage(error));
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private isDuplicateCodeConflict(error: HttpErrorResponse): boolean {
    const message = mapHttpErrorMessage(error).toLowerCase();
    return message.includes('código') || message.includes('codigo') || message.includes('code');
  }

  private loadCurrencies(): void {
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
        this.error.set('No se pudieron cargar las monedas');
      },
      complete: () => this.loading.set(false),
    });
  }

  private resetForm(): void {
    this.form.reset({
      code: '',
      name: '',
      description: '',
      symbol: '',
      decimals: 2,
      isFunctional: false,
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
