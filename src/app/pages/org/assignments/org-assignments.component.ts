import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';
import { AuthUserSummary } from '../../../core/models/auth-admin.models';
import { SessionStore } from '../../../core/state/session.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  OrgBranchRecord,
  OrgBranchService,
} from '../../../services/org/org-branch.service';
import {
  OrgAssignmentRecord,
  OrgAssignmentService,
} from '../../../services/org/org-assignment.service';

@Component({
  selector: 'app-org-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzSelectModule,
    NzButtonModule,
    NzModalModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzEmptyModule,
    NzFormModule,
    NzPaginationModule,
    PageHeaderComponent,
  ],
  templateUrl: './org-assignments.component.html',
  styleUrl: './org-assignments.component.css',
  providers: [DatePipe],
})
export class OrgAssignmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assignmentService = inject(OrgAssignmentService);
  private readonly branchService = inject(OrgBranchService);
  private readonly usersService = inject(UsersAdminService);
  private readonly sessionStore = inject(SessionStore);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly datePipe = inject(DatePipe);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly catalogsLoading = signal(false);
  readonly saving = signal(false);
  readonly rows = signal<AssignmentRow[]>([]);
  readonly assignments = signal<OrgAssignmentRecord[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(1);
  readonly pageSize = signal(10);
  readonly initialized = signal(false);

  readonly breadcrumbs = [
    { label: 'Organización', link: '/main/org' },
    { label: 'Asignaciones' },
  ];

  readonly branches = signal<OrgBranchRecord[]>([]);
  readonly branchOptions = signal<Array<{ label: string; value: string }>>([]);
  readonly users = signal<Array<{ id: string; label: string; email?: string }>>(
    [],
  );
  readonly usersById = signal(new Map<string, AuthUserSummary>());
  readonly branchesById = signal(new Map<string, OrgBranchRecord>());
  readonly modalVisible = signal(false);

  readonly filtersForm = this.fb.nonNullable.group({
    userId: [''],
    branchId: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    branchId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  canCreate(): boolean {
    return this.sessionStore.canWrite('ORG');
  }

  canDelete(): boolean {
    return this.sessionStore.hasPermission('ORG', 'delete');
  }

  applyFilters(): void {
    this.pageIndex.set(1);
    this.loadAssignments();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAssignments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAssignments();
  }

  clearFilters(): void {
    this.filtersForm.reset({ userId: '', branchId: '' });
    this.pageIndex.set(1);
    this.loadAssignments();
  }

  goBranches(): void {
    this.router.navigate(['/main/org'], { queryParams: { tab: 'branches' } });
  }

  openCreateModal(): void {
    this.createForm.reset({ userId: '', branchId: '' });
    this.modalVisible.set(true);
  }

  closeCreateModal(): void {
    if (this.saving()) {
      return;
    }
    this.modalVisible.set(false);
  }

  createAssignment(): void {
    if (this.createForm.invalid || !this.canCreate()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.assignmentService.create(this.createForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('Asignación creada');
        this.modalVisible.set(false);

        this.loadAssignments();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.message.warning(
            'La asignación ya existe para ese usuario y sucursal',
          );
        } else {
          this.message.error('No se pudo crear la asignación');
        }
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  deleteAssignment(id: string): void {
    if (!this.canDelete()) {
      return;
    }

    this.loading.set(true);
    this.assignmentService.remove(id).subscribe({
      next: () => {
        const shouldGoPreviousPage =
          this.rows().length === 1 && this.pageIndex() > 1;
        this.message.success('Asignación eliminada');
        if (shouldGoPreviousPage) {
          this.pageIndex.set(this.pageIndex() - 1);
        }
        this.loadAssignments();
      },
      error: () => {
        this.message.error('No se pudo eliminar la asignación');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }
    return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm') ?? '-';
  }

  confirmDelete(item: AssignmentRow): void {
    this.modal.confirm({
      nzTitle: '¿Confirma eliminar esta asignación?',
      nzContent: 'Esta acción no se puede deshacer.',
      nzOkDanger: true,
      nzOnOk: () => this.deleteAssignment(item.id),
    });
  }

  private loadInitialData(): void {
    this.loading.set(true);
    this.catalogsLoading.set(true);
    forkJoin({
      users: this.usersService.list(),
      branches: this.branchService.list({ page: 1, size: 200, search: '' }),
    })
      .pipe(
        finalize(() => {
          this.catalogsLoading.set(false);
          this.initialized.set(true);
        }),
      )
      .subscribe({
        next: ({ users, branches }) => {
          const normalizedUsers = this.normalizeUsers(users);
          const normalizedBranches =
            this.normalizePaged<OrgBranchRecord>(branches);

          this.setUsersCatalog(normalizedUsers);
          this.setBranchesCatalog(normalizedBranches.data);

          console.debug('[ORG_ASSIGN] users:', normalizedUsers.length);
          console.debug(
            '[ORG_ASSIGN] branches:',
            normalizedBranches.data.length,
          );

          this.loadAssignments();
        },
        error: () => {
          this.message.error(
            'No se pudieron cargar los catálogos de usuarios y sucursales',
          );
          this.rows.set([]);
          this.assignments.set([]);
          this.total.set(0);
          this.loading.set(false);
        },
      });
  }

  private loadAssignments(): void {
    const { userId, branchId } = this.filtersForm.getRawValue();

    this.loading.set(true);
    this.assignmentService
      .list({
        page: this.pageIndex(),
        size: this.pageSize(),
        userId: userId || undefined,
        branchId: branchId || undefined,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.initialized.set(true);
        }),
      )
      .subscribe({
        next: (response) => {
          const paged = this.normalizePaged<OrgAssignmentRecord>(response);
          const assignments = paged.data;

          console.debug('[ORG_ASSIGN] assignments raw:', response);

          this.assignments.set(assignments);
          this.rows.set(assignments.map((item) => this.toRow(item)));
          this.total.set(paged.total ?? assignments.length);
          this.pageIndex.set(paged.page ?? this.pageIndex());
          this.pageSize.set(paged.size ?? this.pageSize());

          console.debug(
            '[ORG_ASSIGN] rows computed:',
            this.rows().length,
            this.rows(),
          );
        },
        error: () => {
          this.rows.set([]);
          this.assignments.set([]);
          this.total.set(0);
          this.message.error('No se pudieron cargar las asignaciones');
        },
      });
  }

  private normalizePaged<T>(response: unknown): {
    data: T[];
    total?: number;
    page?: number;
    size?: number;
    totalPages?: number;
  } {
    const payload = response as {
      data?: unknown;
      total?: number;
      page?: number;
      size?: number;
      totalPages?: number;
    };
    const nestedData = payload?.data as { data?: unknown } | undefined;

    const data = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(nestedData?.data)
        ? nestedData.data
        : [];

    return {
      data: data as T[],
      total: typeof payload?.total === 'number' ? payload.total : undefined,
      page: typeof payload?.page === 'number' ? payload.page : undefined,
      size: typeof payload?.size === 'number' ? payload.size : undefined,
      totalPages:
        typeof payload?.totalPages === 'number'
          ? payload.totalPages
          : undefined,
    };
  }

  private normalizeUsers(response: unknown): AuthUserSummary[] {
    if (Array.isArray(response)) {
      return response as AuthUserSummary[];
    }

    const payload = response as { data?: unknown };
    return Array.isArray(payload?.data)
      ? (payload.data as AuthUserSummary[])
      : [];
  }

  private setUsersCatalog(users: AuthUserSummary[]): void {
    this.usersById.set(new Map(users.map((user) => [user.id, user])));
    this.users.set(
      users.map((user) => ({
        id: user.id,
        label: `${user.fullName || user.username} (${user.email})`,
        email: user.email,
      })),
    );
  }

  private setBranchesCatalog(branches: OrgBranchRecord[]): void {
    this.branchesById.set(
      new Map(branches.map((branch) => [branch.id, branch])),
    );
    this.branches.set(branches);
    this.branchOptions.set(
      branches.map((branch) => ({
        label: `${branch.code ?? ''} - ${branch.name ?? branch.id}`,
        value: branch.id,
      })),
    );
  }

  private toRow(item: OrgAssignmentRecord): AssignmentRow {
    const user = this.usersById().get(item.userId);
    const branch = this.branchesById().get(item.branchId);

    return {
      id: item.id,
      userId: item.userId,
      branchId: item.branchId,
      userLabel: user?.fullName ?? user?.username ?? item.userId,
      branchLabel: branch
        ? `${branch.code ?? ''} - ${branch.name ?? branch.id}`
        : item.branchId,
      active: item.active,
      updatedAt: item.updatedAt,
    };
  }
}

interface AssignmentRow {
  id: string;
  userId: string;
  branchId: string;
  userLabel: string;
  branchLabel: string;
  active: boolean;
  updatedAt?: string;
}
