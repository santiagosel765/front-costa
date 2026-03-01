import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableStateService } from '../../../shared/table/table-state.service';
import { MstCategory, MstCategoryService } from '../../../services/mst/mst-category.service';

@Component({
  selector: 'app-mst-categories-page', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzInputModule, NzModalModule, NzTreeSelectModule, AppDataTableComponent, HasPermissionDirective],
  templateUrl: './categories-page.component.html',
  providers: [TableStateService],
})
export class CategoriesPageComponent implements OnInit {
  private readonly api = inject(MstCategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly table = inject(TableStateService);

  readonly rows = signal<MstCategory[]>([]); readonly total = signal(0); readonly loading = signal(false);
  readonly modal = signal(false); readonly saving = signal(false); readonly editing = signal<string | null>(null);
  readonly tree = signal<Array<{ title: string; key: string; value: string; children?: unknown[] }>>([]);

  readonly form = this.fb.group({ name: ['', Validators.required], code: [''], parentId: [null as string | null], sortOrder: [0] });

  readonly columns: AppDataTableColumn<MstCategory>[] = [
    { key: 'name', title: 'Nombre' }, { key: 'code', title: 'Código' },
    { key: 'active', title: 'Estado', cellType: 'tag', tagColor: r => r.active ? 'green' : 'default', tagText: r => r.active ? 'Activo' : 'Inactivo' },
    { key: 'actions', title: 'Acciones', cellType: 'actions', actions: [{ type: 'edit', label: 'Editar', icon: 'edit' }, { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar categoría?' }] },
  ];

  ngOnInit(): void { this.table.init(this.route, { page: 1, size: 10 }); this.table.state$.subscribe(() => this.load()); this.api.tree().subscribe(t => this.tree.set(t)); }
  load(): void { this.loading.set(true); this.api.list({ ...this.table.snapshot }).subscribe({ next: r => { this.rows.set(r.data); this.total.set(r.total); }, complete: () => this.loading.set(false) }); }
  onPageChange(v: { pageIndex: number; pageSize: number }): void { this.table.patch(this.router, { page: v.pageIndex, size: v.pageSize }); }
  onSearchChange(q: string): void { this.table.patch(this.router, { q, page: 1 }); }
  openCreate(): void { this.editing.set(null); this.form.reset({ name: '', code: '', parentId: null, sortOrder: 0 }); this.modal.set(true); }
  edit(row: MstCategory): void { this.editing.set(row.id); this.form.patchValue({ name: row.name, code: row.code ?? '', parentId: row.parentId ?? null, sortOrder: row.sortOrder ?? 0 }); this.modal.set(true); }
  remove(row: MstCategory): void { this.api.remove(row.id).subscribe({ next: () => { this.msg.success('Categoría eliminada'); this.load(); }, error: () => this.msg.error('No se pudo eliminar') }); }
  action(e: { type: 'edit'|'delete'|'custom'; row: MstCategory }): void { if (e.type === 'edit') this.edit(e.row); if (e.type === 'delete') this.remove(e.row); }
  save(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving.set(true); const req = this.editing() ? this.api.update(this.editing()!, this.form.getRawValue() as any) : this.api.create(this.form.getRawValue() as any); req.subscribe({ next: () => { this.msg.success('Guardado correctamente'); this.modal.set(false); this.load(); }, error: () => this.msg.error('No se pudo guardar'), complete: () => this.saving.set(false) }); }
}
