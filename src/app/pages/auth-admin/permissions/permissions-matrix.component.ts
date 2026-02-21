import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { finalize, forkJoin } from 'rxjs';

import { AuthModuleSummary, AuthRoleSummary } from '../../../core/models/auth-admin.models';
import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';
import { PermissionsAdminService } from '../../../core/services/auth-admin/permissions-admin.service';
import { RolesAdminService } from '../../../core/services/auth-admin/roles-admin.service';

@Component({
  standalone: true,
  selector: 'app-permissions-matrix',
  templateUrl: './permissions-matrix.component.html',
  styleUrls: ['./permissions-matrix.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzCheckboxModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzSelectModule,
    NzSpinModule,
  ],
})
export class PermissionsMatrixComponent implements OnInit {
  private readonly permissionsService = inject(PermissionsAdminService);
  private readonly rolesService = inject(RolesAdminService);
  private readonly modulesService = inject(ModulesAdminService);
  private readonly message = inject(NzMessageService);

  readonly roles = signal<AuthRoleSummary[]>([]);
  readonly modules = signal<AuthModuleSummary[]>([]);
  readonly loading = signal(false);
  readonly roleModulesLoading = signal(false);
  readonly saving = signal(false);
  readonly isLoading = computed(() => this.loading() || this.roleModulesLoading());

  readonly selectedRoleId = signal<string | null>(null);
  readonly currentAssigned = signal<string[]>([]);
  readonly originalAssigned = signal<string[]>([]);
  readonly availableSelection = signal<Set<string>>(new Set());
  readonly assignedSelection = signal<Set<string>>(new Set());

  readonly availableModules = computed(() =>
    this.modules().filter((module) => !this.currentAssigned().includes(module.id)),
  );
  readonly assignedModules = computed(() =>
    this.modules().filter((module) => this.currentAssigned().includes(module.id)),
  );
  readonly hasChanges = computed(() => {
    const original = new Set(this.originalAssigned());
    const current = new Set(this.currentAssigned());
    if (original.size !== current.size) return true;
    for (const id of current) {
      if (!original.has(id)) return true;
    }
    return false;
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    forkJoin({
      roles: this.rolesService.list(),
      modules: this.modulesService.list(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ roles, modules }) => {
          this.roles.set(roles ?? []);
          this.modules.set(modules ?? []);

          const firstRole = this.selectedRoleId() ?? roles?.[0]?.id ?? null;
          this.onRoleChange(firstRole);
        },
        error: () => this.message.error('No se pudo cargar permisos'),
      });
  }

  onRoleChange(roleId: string | null): void {
    this.selectedRoleId.set(roleId);
    this.availableSelection.set(new Set());
    this.assignedSelection.set(new Set());

    if (!roleId) {
      this.currentAssigned.set([]);
      this.originalAssigned.set([]);
      return;
    }

    this.roleModulesLoading.set(true);
    this.permissionsService
      .getRoleModules(roleId)
      .pipe(finalize(() => this.roleModulesLoading.set(false)))
      .subscribe({
        next: (assignment) => {
          const assigned = assignment?.moduleIds ?? [];
          this.currentAssigned.set([...assigned]);
          this.originalAssigned.set([...assigned]);
        },
        error: () => {
          this.message.error('No se pudieron cargar los módulos del rol');
          this.currentAssigned.set([]);
          this.originalAssigned.set([]);
        },
      });
  }

  toggleSelection(target: 'available' | 'assigned', id: string, checked: boolean): void {
    const selection = target === 'available' ? this.availableSelection() : this.assignedSelection();
    const updated = new Set(selection);
    if (checked) {
      updated.add(id);
    } else {
      updated.delete(id);
    }
    if (target === 'available') {
      this.availableSelection.set(updated);
    } else {
      this.assignedSelection.set(updated);
    }
  }

  moveToAssigned(): void {
    const updated = new Set(this.currentAssigned());
    this.availableSelection().forEach((id) => updated.add(id));
    this.currentAssigned.set([...updated]);
    this.availableSelection.set(new Set());
  }

  moveToAvailable(): void {
    const updated = this.currentAssigned().filter((id) => !this.assignedSelection().has(id));
    this.currentAssigned.set(updated);
    this.assignedSelection.set(new Set());
  }

  assignAll(): void {
    const updated = this.modules().map((m) => m.id);
    this.currentAssigned.set(updated);
    this.availableSelection.set(new Set());
  }

  clearAll(): void {
    this.currentAssigned.set([]);
    this.assignedSelection.set(new Set());
  }

  save(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      this.message.info('Selecciona un rol para actualizar');
      return;
    }

    this.saving.set(true);
    this.permissionsService
      .updateRoleModules(roleId, this.currentAssigned())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          const updatedIds = response?.moduleIds ?? this.currentAssigned();
          this.currentAssigned.set([...updatedIds]);
          this.originalAssigned.set([...updatedIds]);
          this.message.success('Permisos actualizados');
        },
        error: () => this.message.error('Error al guardar permisos'),
      });
  }
}
