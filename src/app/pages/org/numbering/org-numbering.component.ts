import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { Subject, takeUntil } from 'rxjs';

import { DocumentTypeRecord } from '../../../services/config/config.models';
import { ConfigDocumentTypeService } from '../../../services/config/config-document-type.service';
import { OrgBranchRecord, OrgBranchService } from '../../../services/org/org-branch.service';
import { OrgDocumentNumbering, OrgDocumentNumberingDto, OrgDocumentNumberingService } from '../../../services/org/org-document-numbering.service';
import { SessionStore } from '../../../core/state/session.store';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn, TableState } from '../../../shared/components/app-data-table/app-data-table.models';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({
  selector: 'app-org-numbering',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, NzInputNumberModule, NzSwitchModule, NzSelectModule, NzIconModule, AppDataTableComponent],
  templateUrl: './org-numbering.component.html',
  styleUrl: './org-numbering.component.css',
  providers: [TableStateService, DatePipe],
})
export class OrgNumberingComponent implements OnInit, OnDestroy {
  private readonly api = inject(OrgDocumentNumberingService);
  private readonly branchApi = inject(OrgBranchService);
  private readonly documentTypeApi = inject(ConfigDocumentTypeService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  private readonly datePipe = inject(DatePipe);
  readonly tableState = inject(TableStateService);
  private readonly destroy$ = new Subject<void>();

  readonly rows = signal<OrgDocumentNumbering[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly isModalVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly branches = signal<OrgBranchRecord[]>([]);
  readonly documentTypes = signal<DocumentTypeRecord[]>([]);

  readonly form = this.fb.nonNullable.group({
    branchId: ['', [Validators.required]],
    documentTypeId: ['', [Validators.required]],
    series: ['', [Validators.required]],
    nextNumber: [1, [Validators.required, Validators.min(1)]],
    padding: [8, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  readonly columns: AppDataTableColumn<OrgDocumentNumbering>[] = [
    { key: 'branch', title: 'Sucursal', valueGetter: (row) => this.resolveBranchName(row) },
    { key: 'documentType', title: 'Tipo documento', valueGetter: (row) => this.resolveDocumentTypeName(row) },
    { key: 'series', title: 'Serie' },
    { key: 'nextNumber', title: 'Próximo' },
    { key: 'padding', title: 'Padding' },
    { key: 'preview', title: 'Preview', valueGetter: (row) => this.buildPreview(row.series, row.padding, row.nextNumber) },
    { key: 'active', title: 'Estado', cellType: 'tag', tagColor: (r) => (r.active ? 'green' : 'red'), tagText: (r) => (r.active ? 'Activo' : 'Inactivo') },
    { key: 'updatedAt', title: 'Actualizado', valueGetter: (r) => this.datePipe.transform(r.updatedAt, 'dd/MM/yyyy HH:mm') ?? '-' },
    {
      key: 'actions', title: 'Acciones', cellType: 'actions', actions: [
        { type: 'edit', label: 'Editar', icon: 'edit', disabled: () => !this.canWrite() },
        { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar numeración?', disabled: () => !this.canDelete() },
      ],
    },
  ];

  ngOnInit(): void {
    this.tableState.init(this.route, { page: 1, size: 10 });
    this.tableState.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => this.load(state));
    this.loadBranches();
    this.loadDocumentTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canWrite(): boolean { return this.sessionStore.canWrite('ORG'); }
  canDelete(): boolean { return this.sessionStore.hasPermission('ORG', 'delete'); }

  get preview(): string {
    const { series, padding, nextNumber } = this.form.getRawValue();
    return this.buildPreview(series, padding, nextNumber);
  }

  get branchOptions(): Array<{ label: string; value: string }> {
    return this.branches().map((branch) => ({ label: `${branch.code} - ${branch.name}`, value: branch.id }));
  }

  get documentTypeOptions(): Array<{ label: string; value: string }> {
    return this.documentTypes().map((documentType) => ({ label: `${documentType.code} - ${documentType.name}`, value: documentType.id }));
  }

  onPageChange(change: { pageIndex: number; pageSize: number }): void {
    this.tableState.patch(this.router, { page: change.pageIndex, size: change.pageSize });
  }

  onSearchChange(search: string): void {
    this.tableState.patch(this.router, { q: search, page: 1 });
  }

  handleAction(event: { type: 'edit' | 'delete' | 'custom'; row: OrgDocumentNumbering }): void {
    if (event.type === 'edit') {
      this.editingId.set(event.row.id);
      this.form.reset({
        branchId: event.row.branchId ?? '',
        documentTypeId: event.row.documentTypeId ?? '',
        series: event.row.series ?? '',
        nextNumber: event.row.nextNumber ?? 1,
        padding: event.row.padding ?? 8,
        active: !!event.row.active,
      });
      this.isModalVisible.set(true);
      return;
    }

    if (event.type === 'delete') {
      this.remove(event.row.id);
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ branchId: '', documentTypeId: '', series: '', nextNumber: 1, padding: 8, active: true });
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    if (!this.saving()) {
      this.isModalVisible.set(false);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.editingId();
    const payload = this.form.getRawValue() as OrgDocumentNumberingDto;
    this.saving.set(true);

    const request$ = id ? this.api.update(id, payload) : this.api.create(payload);
    request$.subscribe({
      next: () => {
        this.message.success(id ? 'Numeración actualizada' : 'Numeración creada');
        this.isModalVisible.set(false);
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo guardar la numeración');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private load(state: TableState): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list({ page: state.page, size: state.size, search: state.q }).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.total.set(response.total ?? 0);
      },
      error: () => {
        this.error.set('No se pudieron cargar las numeraciones');
        this.rows.set([]);
        this.total.set(0);
      },
      complete: () => this.loading.set(false),
    });
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.api.remove(id).subscribe({
      next: () => {
        this.message.success('Numeración eliminada');
        this.load(this.tableState.snapshot);
      },
      error: () => {
        this.message.error('No se pudo eliminar la numeración');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadBranches(): void {
    this.branchApi.list({ page: 1, size: 200 }).subscribe({
      next: (response) => this.branches.set(response.data ?? []),
      error: () => this.branches.set([]),
    });
  }

  private loadDocumentTypes(): void {
    this.documentTypeApi.list({ page: 1, size: 200 }).subscribe({
      next: (response) => this.documentTypes.set(response.data ?? []),
      error: () => this.documentTypes.set([]),
    });
  }

  private resolveBranchName(row: OrgDocumentNumbering): string {
    return row.branchName || row.branch?.name || this.branches().find((branch) => branch.id === row.branchId)?.name || '—';
  }

  private resolveDocumentTypeName(row: OrgDocumentNumbering): string {
    return row.documentTypeName || row.documentType?.name || this.documentTypes().find((dt) => dt.id === row.documentTypeId)?.name || '—';
  }

  private buildPreview(series?: string, padding?: number, nextNumber?: number): string {
    const safeSeries = (series || 'S001').trim() || 'S001';
    const safePadding = Math.max(1, Number(padding) || 8);
    const safeNumber = Math.max(1, Number(nextNumber) || 1);
    return `${safeSeries}-${String(safeNumber).padStart(safePadding, '0')}`;
  }
}
