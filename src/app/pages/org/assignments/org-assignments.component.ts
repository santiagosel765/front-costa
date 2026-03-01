import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';
import { SessionStore } from '../../../core/state/session.store';
import { OrgBranchService } from '../../../services/org/org-branch.service';
import { OrgAssignmentRecord, OrgAssignmentService } from '../../../services/org/org-assignment.service';

@Component({
  selector: 'app-org-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzSelectModule, NzButtonModule, NzModalModule, NzTableModule, NzTagModule, NzIconModule, NzPopconfirmModule, NzFormModule],
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
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal(false);
  readonly rows = signal<OrgAssignmentRecord[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly size = signal(10);
  readonly branches = signal<Array<{ label: string; value: string }>>([]);
  readonly users = signal<Array<{ label: string; value: string }>>([]);
  readonly modalVisible = signal(false);
  readonly showSelectionMessage = signal(true);

  readonly filtersForm = this.fb.nonNullable.group({
    userId: [''],
    branchId: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    branchId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadUsers();
  }

  canCreate(): boolean {
    return this.sessionStore.canWrite('ORG');
  }

  canDelete(): boolean {
    return this.sessionStore.hasPermission('ORG', 'delete');
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadAssignments();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadAssignments();
  }

  openCreateModal(): void {
    this.createForm.reset({ userId: '', branchId: '' });
    this.modalVisible.set(true);
  }

  closeCreateModal(): void {
    this.modalVisible.set(false);
  }

  createAssignment(): void {
    if (this.createForm.invalid || !this.canCreate()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.assignmentService.create(this.createForm.getRawValue()).subscribe({
      next: () => {
        this.message.success('Asignación creada');
        this.modalVisible.set(false);
        this.loadAssignments();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.message.warning('La asignación ya existe para ese usuario y sucursal');
        } else {
          this.message.error('No se pudo crear la asignación');
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  deleteAssignment(id: string): void {
    if (!this.canDelete()) {
      return;
    }

    this.loading.set(true);
    this.assignmentService.remove(id).subscribe({
      next: () => {
        this.message.success('Asignación eliminada');
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

  private loadUsers(): void {
    this.usersService.list().subscribe({
      next: (response) => {
        this.users.set((response ?? []).map((user) => ({
          label: `${user.fullName || user.username} (${user.email})`,
          value: user.id,
        })));
      },
      error: () => {
        this.users.set([]);
      },
    });
  }

  private loadBranches(): void {
    this.branchService.list({ page: 1, size: 200 }).subscribe({
      next: (response) => {
        this.branches.set((response.data ?? []).map((branch) => ({ label: `${branch.code ?? ''} - ${branch.name ?? branch.id}`, value: branch.id })));
      },
      error: () => this.branches.set([]),
    });
  }

  private loadAssignments(): void {
    const { userId, branchId } = this.filtersForm.getRawValue();

    if (!userId && !branchId) {
      this.showSelectionMessage.set(true);
      this.rows.set([]);
      this.total.set(0);
      return;
    }

    this.showSelectionMessage.set(false);

    this.loading.set(true);
    this.assignmentService.list({
      page: this.page(),
      size: this.size(),
      userId: userId || undefined,
      branchId: branchId || undefined,
    }).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.total.set(response.total ?? 0);
      },
      error: () => {
        this.rows.set([]);
        this.total.set(0);
        this.message.error('No se pudieron cargar las asignaciones');
      },
      complete: () => this.loading.set(false),
    });
  }
}
