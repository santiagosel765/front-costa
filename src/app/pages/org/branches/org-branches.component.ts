import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
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
import { OrgBranchDto, OrgBranchRecord, OrgBranchService } from '../../../services/org/org-branch.service';

@Component({
  selector: 'app-org-branches',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzModalModule,
    NzInputModule,
    NzSwitchModule,
    NzFormModule,
    NzIconModule,
    AppDataTableComponent,
  ],
  templateUrl: './org-branches.component.html',
  styleUrl: './org-branches.component.css',
  providers: [TableStateService, DatePipe],
})
export class OrgBranchesComponent implements OnInit, OnDestroy {
  private readonly api = inject(OrgBranchService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  private readonly datePipe = inject(DatePipe);
  readonly tableState = inject(TableStateService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<OrgBranchRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly isModalVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
    phone: [''],
    email: [''],
    managerName: [''],
    active: [true],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    country: [''],
    postalCode: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    locationNotes: [''],
  });

  readonly columns: AppDataTableColumn<OrgBranchRecord>[] = [
    { key: 'code', title: 'Código' },
    { key: 'name', title: 'Nombre' },
    {
      key: 'location',
      title: 'Ubicación',
      valueGetter: (row) => this.resolveLocationSummary(row),
    },
    { key: 'description', title: 'Descripción' },
    { key: 'active', title: 'Estado', cellType: 'tag', tagColor: (r) => (r.active ? 'green' : 'red'), tagText: (r) => (r.active ? 'Activo' : 'Inactivo') },
    {
      key: 'updatedAt',
      title: 'Actualizado',
      valueGetter: (r) => this.datePipe.transform(r.updatedAt, 'dd/MM/yyyy HH:mm') ?? '-',
    },
    {
      key: 'actions',
      title: 'Acciones',
      cellType: 'actions',
      width: '280px',
      actions: [
        { type: 'edit', label: 'Editar', icon: 'edit', disabled: () => !this.canWrite() },
        {
          type: 'delete',
          label: 'Eliminar',
          icon: 'delete',
          danger: true,
          confirmTitle: '¿Confirma eliminar esta sucursal?',
          disabled: () => !this.canDelete(),
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.tableState.init(this.route, { page: 1, size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadBranches());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canWrite(): boolean { return this.sessionStore.canWrite('ORG'); }
  canDelete(): boolean { return this.sessionStore.hasPermission('ORG', 'delete'); }

  get codeError(): string | null {
    const control = this.form.controls.code;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'El código es obligatorio.';
    }
    if (control.hasError('duplicate')) {
      return 'El código ya existe.';
    }
    return null;
  }

  get nameError(): string | null {
    const control = this.form.controls.name;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'El nombre es obligatorio.';
    }
    return null;
  }

  get emptyMessage(): string {
    return this.tableState.snapshot.q
      ? `No hay resultados para "${this.tableState.snapshot.q}".`
      : 'No hay sucursales registradas.';
  }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSearchChange(search: string): void {
    this.tableState.patch(this.router, { q: search, page: 1 });
  }

  clearSearch(): void {
    this.tableState.patch(this.router, { q: '', page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: OrgBranchRecord }): void {
    if (event.type === 'edit') {
      this.editingId.set(event.row.id);
      this.form.reset({
        code: event.row.code ?? '',
        name: event.row.name ?? '',
        description: event.row.description ?? '',
        phone: event.row.phone ?? '',
        email: event.row.email ?? '',
        managerName: event.row.managerName ?? '',
        active: !!event.row.active,
        addressLine1: event.row.addressLine1 ?? '',
        addressLine2: event.row.addressLine2 ?? '',
        city: event.row.city ?? '',
        state: event.row.state ?? '',
        country: event.row.country ?? '',
        postalCode: event.row.postalCode ?? '',
        latitude: event.row.latitude ?? null,
        longitude: event.row.longitude ?? null,
        locationNotes: event.row.locationNotes ?? '',
      });
      this.isModalVisible.set(true);
      return;
    }
    this.remove(event.row.id);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      code: '', name: '', description: '', phone: '', email: '', managerName: '', active: true,
      addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '',
      latitude: null, longitude: null, locationNotes: '',
    });
    this.form.controls.code.setErrors(null);
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    if (this.saving()) {
      return;
    }
    this.isModalVisible.set(false);
  }

  save(): void {
    if (!this.validateUniqueCode()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const id = this.editingId();
    const payload = this.form.getRawValue() as OrgBranchDto;
    const request$ = id ? this.api.update(id, payload) : this.api.create(payload);
    request$.subscribe({
      next: () => {
        this.message.success(id ? 'Sucursal actualizada' : 'Sucursal creada');
        this.isModalVisible.set(false);
        this.loadBranches(!id);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.form.controls.code.setErrors({ duplicate: true });
          this.form.controls.code.markAsTouched();
          this.message.warning('El código ya existe, use uno diferente.');
        } else {
          this.message.error('No se pudo guardar la sucursal. Verifique los datos ingresados.');
        }
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private resolveLocationSummary(row: OrgBranchRecord): string {
    const firstLine = row.addressLine1?.trim();
    const cityState = [row.city, row.state].filter(Boolean).join('/');
    if (!firstLine && !cityState) {
      return '—';
    }
    return [firstLine, cityState ? `(${cityState})` : ''].filter(Boolean).join(' ');
  }

  private validateUniqueCode(): boolean {
    const code = this.form.controls.code.value.trim().toLowerCase();
    const editingId = this.editingId();
    const duplicated = this.rows().some((row) => row.id !== editingId && (row.code ?? '').trim().toLowerCase() === code);

    if (duplicated) {
      this.form.controls.code.setErrors({ duplicate: true });
      this.form.controls.code.markAsTouched();
      return false;
    }

    return true;
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.api.remove(id).subscribe({
      next: () => {
        const shouldGoPreviousPage = this.rows().length === 1 && this.tableState.snapshot.page > 1;
        this.message.success('Sucursal eliminada');
        if (shouldGoPreviousPage) {
          this.tableState.patch(this.router, { page: this.tableState.snapshot.page - 1 });
          return;
        }
        this.loadBranches();
      },
      error: () => {
        this.message.error('No se pudo eliminar la sucursal');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadBranches(resetPage = false): void {
    const snapshot: TableState = this.tableState.snapshot;
    const state: TableState = resetPage ? { ...snapshot, page: 1 } : snapshot;
    this.loading.set(true);
    this.error.set(null);

    this.api.list({ page: state.page, size: state.size, search: state.q }).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.total.set(response.total ?? 0);
        this.tableState.patch(this.router, {
          page: response.page ?? 1,
          size: response.size ?? state.size,
        });
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
