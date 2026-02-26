import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SessionStore } from '../../../core/state/session.store';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../../shared/table/table-state.service';
import { CatalogDto, CatalogRecord } from '../../../services/config/config.models';

interface CatalogCrudApi {
  list(query: { page: number; size: number; search?: string }): import('rxjs').Observable<{ data: CatalogRecord[]; total: number }>;
  create(dto: CatalogDto): import('rxjs').Observable<CatalogRecord>;
  update(id: string, dto: CatalogDto): import('rxjs').Observable<CatalogRecord>;
  remove(id: string): import('rxjs').Observable<void>;
}

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, NzSwitchModule, AppDataTableComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  providers: [TableStateService],
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  @Input({ required: true }) title = '';
  @Input({ required: true }) moduleKey = '';
  @Input({ required: true }) api!: CatalogCrudApi;
  @Input() createLabel = 'Nuevo';

  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  readonly tableState = inject(TableStateService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<CatalogRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly isModalVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    active: [true],
  });

  readonly columns: AppDataTableColumn<CatalogRecord>[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'name', title: 'Nombre', sortable: true },
    {
      key: 'active',
      title: 'Activo',
      cellType: 'tag',
      tagColor: (row) => (row.active ? 'green' : 'red'),
      tagText: (row) => (row.active ? 'Sí' : 'No'),
    },
    {
      key: 'updatedAt',
      title: 'Actualizado',
      valueGetter: (row) => row.updatedAt ?? row.updated_at ?? '-',
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '220px',
      cellType: 'actions',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit', disabled: () => !this.canWrite() },
        {
          type: 'delete',
          label: 'Eliminar',
          icon: 'delete',
          danger: true,
          confirmTitle: '¿Eliminar registro?',
          disabled: () => !this.canDelete(),
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.tableState.init(this.route, { size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => this.load(state));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canWrite(): boolean {
    return this.sessionStore.canWrite(this.moduleKey);
  }

  canDelete(): boolean {
    return this.sessionStore.hasPermission(this.moduleKey, 'delete');
  }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSearchChange(search: string): void {
    this.tableState.patch(this.router, { q: search, page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: CatalogRecord }): void {
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
    this.form.reset({ code: '', name: '', active: true });
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

    this.loading.set(true);
    const payload = this.form.getRawValue() as CatalogDto;
    const id = this.editingId();
    const request$ = id ? this.api.update(id, payload) : this.api.create(payload);

    request$.subscribe({
      next: () => {
        this.message.success(id ? 'Registro actualizado' : 'Registro creado');
        this.isModalVisible.set(false);
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo guardar el registro');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private openEdit(row: CatalogRecord): void {
    this.editingId.set(row.id);
    this.form.reset({ code: row.code ?? '', name: row.name ?? '', active: !!row.active });
    this.isModalVisible.set(true);
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.api.remove(id).subscribe({
      next: () => {
        this.message.success('Registro eliminado');
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo eliminar el registro');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private load(state: TableState): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .list({ page: state.page, size: state.size, search: state.q })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data ?? []);
          this.total.set(response.total ?? 0);
        },
        error: () => {
          this.error.set('No se pudieron cargar los registros');
          this.rows.set([]);
          this.total.set(0);
        },
        complete: () => this.loading.set(false),
      });
  }
}
