import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { SessionStore } from '../../../core/state/session.store';
import { OrgBranchService } from '../../../services/org/org-branch.service';
import { OrgAssignmentRecord, OrgAssignmentService } from '../../../services/org/org-assignment.service';

@Component({
  selector: 'app-org-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzCardModule, NzRadioModule, NzSelectModule, NzInputModule, NzButtonModule, NzModalModule, NzTableModule, NzTagModule],
  templateUrl: './org-assignments.component.html',
  styleUrl: './org-assignments.component.css',
})
export class OrgAssignmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assignmentService = inject(OrgAssignmentService);
  private readonly branchService = inject(OrgBranchService);
  private readonly sessionStore = inject(SessionStore);
  private readonly message = inject(NzMessageService);

  readonly filterMode = signal<'user' | 'branch'>('branch');
  readonly loading = signal(false);
  readonly rows = signal<OrgAssignmentRecord[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly size = signal(10);
  readonly branches = signal<Array<{ label: string; value: string }>>([]);
  readonly modalVisible = signal(false);

  readonly filtersForm = this.fb.nonNullable.group({
    userId: [''],
    branchId: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    userId: ['', [Validators.required]], // TODO: replace with users selector when /users endpoint is available.
    branchId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadAssignments();
  }

  canCreate(): boolean {
    return this.sessionStore.canWrite('ORG');
  }

  canDelete(): boolean {
    return this.sessionStore.hasPermission('ORG', 'delete');
  }

  setMode(mode: 'user' | 'branch'): void {
    this.filterMode.set(mode);
    this.filtersForm.patchValue({ userId: '', branchId: '' });
    this.page.set(1);
    this.loadAssignments();
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
      error: () => {
        this.message.error('No se pudo crear la asignación');
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

  private loadBranches(): void {
    this.branchService.list({ page: 1, size: 200 }).subscribe({
      next: (response) => {
        this.branches.set((response.data ?? []).map((branch) => ({ label: `${branch.code ?? ''} - ${branch.name ?? branch.id}`, value: branch.id })));
      },
      error: () => this.branches.set([]),
    });
  }

  private loadAssignments(): void {
    const values = this.filtersForm.getRawValue();
    const query = {
      page: this.page(),
      size: this.size(),
      userId: this.filterMode() === 'user' ? values.userId : undefined,
      branchId: this.filterMode() === 'branch' ? values.branchId : undefined,
    };

    this.loading.set(true);
    this.assignmentService.list(query).subscribe({
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
