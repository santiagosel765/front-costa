import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { OrgBranchService } from '../../../services/org/org-branch.service';

@Component({
  selector: 'app-org-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, NzSwitchModule, AppDataTableComponent],
  templateUrl: './org-branches.component.html',
  styleUrl: './org-branches.component.css',
  providers: [TableStateService],
})
export class OrgBranchesComponent implements OnInit, OnDestroy {
  private readonly api = inject(OrgBranchService);
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
    address: [''],
    description: [''],
    active: [true],
  });

  readonly columns: AppDataTableColumn<CatalogRecord>[] = [
    { key: 'code', title: 'Código' },
    { key: 'name', title: 'Nombre' },
    { key: 'address', title: 'Dirección' },
    { key: 'description', title: 'Descripción' },
    { key: 'active', title: 'Activo', cellType: 'tag', tagColor: (r) => (r.active ? 'green' : 'red'), tagText: (r) => (r.active ? 'Sí' : 'No') },
    { key: 'updatedAt', title: 'Actualizado', valueGetter: (r) => r.updatedAt ?? '-' },
    {
      key: 'actions',
      title: 'Acciones',
      cellType: 'actions',
      width: '320px',
      actions: [
        { type: 'custom', label: 'Ver bodegas', icon: 'shop' },
        { type: 'edit', label: 'Editar', icon: 'edit', disabled: () => !this.canWrite() },
        { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar sucursal?', disabled: () => !this.canDelete() },
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

  canWrite(): boolean { return this.sessionStore.canWrite('ORG'); }
  canDelete(): boolean { return this.sessionStore.hasPermission('ORG', 'delete'); }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSearchChange(search: string): void {
    this.tableState.patch(this.router, { q: search, page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: CatalogRecord }): void {
    if (event.type === 'custom') {
      this.router.navigate(['/main/org/branches', event.row.id, 'warehouses']);
      return;
    }
    if (event.type === 'edit') {
      this.editingId.set(event.row.id);
      this.form.reset({ code: event.row.code ?? '', name: event.row.name ?? '', address: event.row.address ?? '', description: event.row.description ?? '', active: !!event.row.active });
      this.isModalVisible.set(true);
      return;
    }
    this.remove(event.row.id);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ code: '', name: '', address: '', description: '', active: true });
    this.isModalVisible.set(true);
  }

  closeModal(): void { this.isModalVisible.set(false); }

  goAssignments(): void {
    this.router.navigate(['/main/org/assignments']);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const id = this.editingId();
    const payload = this.form.getRawValue() as CatalogDto;
    const request$ = id ? this.api.update(id, payload) : this.api.create(payload);
    request$.subscribe({
      next: () => {
        this.message.success(id ? 'Sucursal actualizada' : 'Sucursal creada');
        this.isModalVisible.set(false);
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo guardar la sucursal');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.api.remove(id).subscribe({
      next: () => {
        this.message.success('Sucursal eliminada');
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo eliminar la sucursal');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private load(state: TableState): void {
    this.loading.set(true);
    this.api.list({ page: state.page, size: state.size, search: state.q }).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.total.set(response.total ?? 0);
      },
      error: () => {
        this.rows.set([]);
        this.total.set(0);
        this.error.set('No se pudieron cargar las sucursales');
      },
      complete: () => this.loading.set(false),
    });
  }
}
