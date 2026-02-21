import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { AuthUserSummary } from '../../../core/models/auth-admin.models';
import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';

@Component({
  standalone: true,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzTagModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzPopconfirmModule,
  ],
})
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersAdminService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  readonly users = signal<AuthUserSummary[]>([]);
  readonly filteredUsers = signal<AuthUserSummary[]>([]);
  readonly loading = signal(false);

  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (data) => {
        this.users.set(data ?? []);
        this.applyFilters();
      },
      error: () => this.message.error('No se pudieron cargar los usuarios'),
      complete: () => this.loading.set(false),
    });
  }

  goCreate(): void {
    this.router.navigate(['/main/auth/users/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/main/auth/users', id, 'edit']);
  }

  remove(id: string): void {
    this.loading.set(true);
    this.service.delete(id).subscribe({
      next: () => {
        this.message.success('Usuario eliminado');
        this.reload();
      },
      error: () => this.message.error('No se pudo eliminar el usuario'),
      complete: () => this.loading.set(false),
    });
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onStatusChange(value: 'all' | 'active' | 'inactive' | null): void {
    this.statusFilter = value || 'all';
    this.applyFilters();
  }

  getStatusColor(status: number): string {
    return status === 1 ? 'green' : 'red';
  }

  getStatusText(status: number): string {
    return status === 1 ? 'Activo' : 'Inactivo';
  }

  rolesLabel(user: AuthUserSummary): string {
    const roleNames = user.roleNames?.length ? user.roleNames : user.roles;
    if (roleNames && roleNames.length > 0) {
      return roleNames.join(', ');
    }
    if (user.roleName) {
      return user.roleName;
    }
    return 'Sin rol asignado';
  }

  private applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let data = [...this.users()];

    if (term) {
      data = data.filter((user) =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.fullName ?? '').toLowerCase().includes(term),
      );
    }

    if (this.statusFilter === 'active') {
      data = data.filter((user) => user.status === 1);
    } else if (this.statusFilter === 'inactive') {
      data = data.filter((user) => user.status !== 1);
    }

    this.filteredUsers.set(data);
  }
}
