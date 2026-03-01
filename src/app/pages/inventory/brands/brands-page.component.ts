import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { MstBrand, MstBrandService } from '../../../services/mst/mst-brand.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({ selector: 'app-mst-brands-page', standalone: true, imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzInputModule, NzModalModule, AppDataTableComponent, HasPermissionDirective], templateUrl: './brands-page.component.html', providers: [TableStateService] })
export class BrandsPageComponent implements OnInit {
  private readonly api = inject(MstBrandService); private readonly fb = inject(FormBuilder); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly msg = inject(NzMessageService); readonly table = inject(TableStateService);
  readonly rows = signal<MstBrand[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly modal = signal(false); readonly saving = signal(false); readonly editing = signal<string | null>(null);
  readonly form = this.fb.group({ name: ['', Validators.required], code: [''] });
  readonly columns: AppDataTableColumn<MstBrand>[] = [{ key: 'name', title: 'Nombre' }, { key: 'code', title: 'Código' }, { key: 'active', title: 'Estado', cellType: 'tag', tagColor: r => r.active ? 'green' : 'default', tagText: r => r.active ? 'Activo' : 'Inactivo' }, { key: 'actions', title: 'Acciones', cellType: 'actions', actions: [{ type: 'edit', label: 'Editar', icon: 'edit' }, { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar marca?' }] }];
  ngOnInit(): void { this.table.init(this.route, { page: 1, size: 10 }); this.table.state$.subscribe(() => this.load()); }
  load(): void { this.loading.set(true); this.api.list({ ...this.table.snapshot }).subscribe({ next: r => { this.rows.set(r.data); this.total.set(r.total); }, complete: () => this.loading.set(false) }); }
  onPageChange(v: { pageIndex: number; pageSize: number }): void { this.table.patch(this.router, { page: v.pageIndex, size: v.pageSize }); }
  onSearchChange(q: string): void { this.table.patch(this.router, { q, page: 1 }); }
  openCreate(): void { this.editing.set(null); this.form.reset({ name: '', code: '' }); this.modal.set(true); }
  save(): void { if (this.form.invalid) return; this.saving.set(true); const req = this.editing() ? this.api.update(this.editing()!, this.form.getRawValue() as any) : this.api.create(this.form.getRawValue() as any); req.subscribe({ next: () => { this.msg.success('Marca guardada'); this.modal.set(false); this.load(); }, error: () => this.msg.error('No se pudo guardar'), complete: () => this.saving.set(false) }); }
  action(e: { type: 'edit'|'delete'|'custom'; row: MstBrand }): void { if (e.type === 'edit') { this.editing.set(e.row.id); this.form.patchValue({ name: e.row.name, code: e.row.code ?? '' }); this.modal.set(true); } if (e.type === 'delete') this.api.remove(e.row.id).subscribe(() => this.load()); }
}
