import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { MstAttribute, MstAttributeService } from '../../../services/mst/mst-attribute.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({ selector: 'app-mst-attributes-page', standalone: true, imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzInputModule, NzModalModule, NzTabsModule, NzSwitchModule, NzSelectModule, AppDataTableComponent, HasPermissionDirective], templateUrl: './attributes-page.component.html', providers: [TableStateService] })
export class AttributesPageComponent implements OnInit {
  private readonly api = inject(MstAttributeService); private readonly fb = inject(FormBuilder); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly msg = inject(NzMessageService); readonly table = inject(TableStateService);
  readonly rows = signal<MstAttribute[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly modal = signal(false); readonly saving = signal(false); readonly editing = signal<string | null>(null);
  readonly form = this.fb.group({ name: ['', Validators.required], code: ['', Validators.required], type: ['TEXT', Validators.required], required: [false], searchable: [true], visible: [true], options: this.fb.array([]) });
  readonly columns: AppDataTableColumn<MstAttribute>[] = [{ key: 'name', title: 'Nombre' }, { key: 'code', title: 'Código' }, { key: 'type', title: 'Tipo' }, { key: 'actions', title: 'Acciones', cellType: 'actions', actions: [{ type: 'edit', label: 'Editar', icon: 'edit' }, { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar atributo?' }] }];
  get options(): FormArray { return this.form.controls.options as FormArray; }
  get showOptions(): boolean { const t = this.form.controls.type.value; return t === 'SELECT' || t === 'MULTISELECT'; }
  ngOnInit(): void { this.table.init(this.route, { page: 1, size: 10 }); this.table.state$.subscribe(() => this.load()); }
  load(): void { this.loading.set(true); this.api.list({ ...this.table.snapshot }).subscribe({ next: r => { this.rows.set(r.data); this.total.set(r.total); }, complete: () => this.loading.set(false) }); }
  onPageChange(v: { pageIndex: number; pageSize: number }): void { this.table.patch(this.router, { page: v.pageIndex, size: v.pageSize }); }
  onSearchChange(q: string): void { this.table.patch(this.router, { q, page: 1 }); }
  addOption(): void { this.options.push(this.fb.group({ value: ['', Validators.required], sortOrder: [0], active: [true] })); }
  removeOption(i: number): void { this.options.removeAt(i); }
  openCreate(): void { this.editing.set(null); this.form.reset({ name: '', code: '', type: 'TEXT', required: false, searchable: true, visible: true }); this.options.clear(); this.modal.set(true); }
  action(e: { type:'edit'|'delete'|'custom'; row:MstAttribute }): void { if (e.type==='delete') this.api.remove(e.row.id).subscribe(() => this.load()); if (e.type==='edit'){ this.editing.set(e.row.id); this.form.patchValue({ ...e.row }); this.options.clear(); (e.row.options ?? []).forEach(o=>this.options.push(this.fb.group({ value:[o.value], sortOrder:[o.sortOrder], active:[o.active] }))); this.modal.set(true);} }
  save(): void { if (this.showOptions && this.options.length === 0) { this.msg.warning('Agregue al menos una opción'); return; } if (this.form.invalid) return; this.saving.set(true); const req = this.editing() ? this.api.update(this.editing()!, this.form.getRawValue() as any) : this.api.create(this.form.getRawValue() as any); req.subscribe({ next: ()=>{ this.msg.success('Atributo guardado'); this.modal.set(false); this.load(); }, error: ()=>this.msg.error('No se pudo guardar'), complete: ()=>this.saving.set(false) }); }
}
