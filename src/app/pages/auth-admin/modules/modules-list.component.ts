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

import { AuthModuleSummary } from '../../../core/models/auth-admin.models';
import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';

@Component({
  standalone: true,
  selector: 'app-modules-list',
  templateUrl: './modules-list.component.html',
  styleUrls: ['./modules-list.component.css'],
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
export class ModulesListComponent implements OnInit {
  private readonly service = inject(ModulesAdminService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  readonly modules = signal<AuthModuleSummary[]>([]);
  readonly filteredModules = signal<AuthModuleSummary[]>([]);
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
        this.modules.set(data ?? []);
        this.applyFilters();
      },
      error: () => this.message.error('No se pudieron cargar los módulos'),
      complete: () => this.loading.set(false),
    });
  }

  goCreate(): void {
    this.router.navigate(['/main/auth/modules/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/main/auth/modules', id, 'edit']);
  }

  remove(id: string): void {
    this.loading.set(true);
    this.service.delete(id).subscribe({
      next: () => {
        this.message.success('Módulo eliminado');
        this.reload();
      },
      error: () => this.message.error('No se pudo eliminar el módulo'),
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

  private applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let data = [...this.modules()];

    if (term) {
      data = data.filter((module) =>
        module.name.toLowerCase().includes(term) ||
        (module.description ?? '').toLowerCase().includes(term),
      );
    }

    if (this.statusFilter === 'active') {
      data = data.filter((module) => module.status === 1);
    } else if (this.statusFilter === 'inactive') {
      data = data.filter((module) => module.status !== 1);
    }

    this.filteredModules.set(data);
  }
}
