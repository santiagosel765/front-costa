import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';

import { RolesAdminService } from '../../../core/services/auth-admin/roles-admin.service';
import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';
import { AuthModuleSummary } from '../../../core/models/auth-admin.models';

@Component({
  standalone: true,
  selector: 'app-role-modules-assignment',
  imports: [CommonModule, FormsModule, NzButtonModule, NzSelectModule],
  template: `
    <nz-select
      [nzOptions]="moduleOptions()"
      [(ngModel)]="selectedModules"
      nzMode="multiple"
      nzPlaceHolder="Módulos"
      style="min-width: 220px;"
    ></nz-select>
    <button nz-button nzType="default" (click)="assign()" [disabled]="!selectedModules || !selectedModules.length">
      Guardar
    </button>
  `,
})
export class RoleModulesAssignmentComponent implements OnInit {
  @Input() roleId!: string;
  @Output() readonly completed = new EventEmitter<void>();

  private readonly rolesService = inject(RolesAdminService);
  private readonly modulesService = inject(ModulesAdminService);
  private readonly message = inject(NzMessageService);

  readonly modules = signal<AuthModuleSummary[]>([]);
  selectedModules: string[] = [];

  moduleOptions = signal<{ label: string; value: string }[]>([]);

  ngOnInit(): void {
    this.modulesService.list().subscribe((modules) => {
      this.modules.set(modules);
      this.moduleOptions.set(modules.map((m) => ({ label: m.name, value: m.id })));
    });
  }

  assign(): void {
    if (!this.roleId) {
      return;
    }

    this.rolesService.assignModules({ roleId: this.roleId, moduleIds: this.selectedModules }).subscribe({
      next: () => {
        this.message.success('Módulos actualizados');
        this.completed.emit();
      },
      error: () => this.message.error('No se pudieron guardar los módulos'),
    });
  }
}
