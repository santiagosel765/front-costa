import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';

import { RolesAdminService } from '../../../core/services/auth-admin/roles-admin.service';
import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';
import { AuthRoleSummary } from '../../../core/models/auth-admin.models';

@Component({
  standalone: true,
  selector: 'app-user-role-assignment',
  imports: [CommonModule, FormsModule, NzButtonModule, NzSelectModule],
  template: `
    <nz-select
      [nzOptions]="roleOptions()"
      [(ngModel)]="selectedRole"
      nzPlaceHolder="Asignar rol"
      style="width: 180px;"
    ></nz-select>
    <button nz-button nzType="default" (click)="assign()" [disabled]="!selectedRole">Asignar</button>
  `,
})
export class UserRoleAssignmentComponent implements OnInit {
  @Input() userId!: string;
  @Output() readonly completed = new EventEmitter<void>();

  private readonly rolesService = inject(RolesAdminService);
  private readonly usersService = inject(UsersAdminService);
  private readonly message = inject(NzMessageService);

  readonly roles = signal<AuthRoleSummary[]>([]);
  selectedRole?: string;

  roleOptions = signal<{ label: string; value: string }[]>([]);

  ngOnInit(): void {
    this.rolesService.list().subscribe((roles) => {
      this.roles.set(roles);
      this.roleOptions.set(roles.map((r) => ({ label: r.name, value: r.id })));
    });
  }

  assign(): void {
    if (!this.userId || !this.selectedRole) {
      return;
    }

    this.usersService.assignRole({ userId: this.userId, roleId: this.selectedRole }).subscribe({
      next: () => {
        this.message.success('Rol asignado');
        this.completed.emit();
      },
      error: () => this.message.error('No se pudo asignar el rol'),
    });
  }
}
