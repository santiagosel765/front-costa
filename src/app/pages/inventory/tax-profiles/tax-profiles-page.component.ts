import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { ConfigTaxService } from '../../../services/config/config-tax.service';
import { MstTaxProfile, MstTaxProfileService } from '../../../services/mst/mst-tax-profile.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({ selector: 'app-mst-tax-profiles-page', standalone: true, imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzInputModule, NzModalModule, NzTabsModule, NzSelectModule, AppDataTableComponent, HasPermissionDirective], templateUrl: './tax-profiles-page.component.html', providers: [TableStateService] })
export class TaxProfilesPageComponent implements OnInit {
  private readonly api = inject(MstTaxProfileService); private readonly taxesApi = inject(ConfigTaxService); private readonly fb = inject(FormBuilder); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); readonly table = inject(TableStateService);
  readonly rows = signal<MstTaxProfile[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly modal = signal(false); readonly editing = signal<string | null>(null); readonly taxes = signal<Array<{ id: string; name: string }>>([]);
  readonly form = this.fb.group({ name: ['', Validators.required], description: [''], taxIds: [[] as string[]] });
  readonly columns: AppDataTableColumn<MstTaxProfile>[] = [{ key: 'name', title: 'Nombre' }, { key: 'description', title: 'Descripción' }, { key: 'actions', title: 'Acciones', cellType: 'actions', actions: [{ type: 'edit', label: 'Editar', icon: 'edit' }, { type: 'delete', label: 'Eliminar', icon: 'delete', danger: true, confirmTitle: '¿Eliminar perfil?' }] }];
  ngOnInit(): void { this.table.init(this.route, { page: 1, size: 10 }); this.table.state$.subscribe(() => this.load()); this.taxesApi.list({ page: 1, size: 200 }).subscribe(r => this.taxes.set(r.data.map(t => ({ id: t.id, name: t.name })))); }
  load(): void { this.loading.set(true); this.api.list({ ...this.table.snapshot }).subscribe({ next: r => { this.rows.set(r.data); this.total.set(r.total); }, complete: () => this.loading.set(false) }); }
  onPageChange(v:{pageIndex:number;pageSize:number}):void{ this.table.patch(this.router,{page:v.pageIndex,size:v.pageSize}); }
  onSearchChange(q:string):void{ this.table.patch(this.router,{q,page:1}); }
  openCreate():void{ this.editing.set(null); this.form.reset({ name:'', description:'', taxIds:[] }); this.modal.set(true); }
  action(e:{type:'edit'|'delete'|'custom';row:MstTaxProfile}):void{ if(e.type==='delete') this.api.remove(e.row.id).subscribe(()=>this.load()); if(e.type==='edit'){ this.editing.set(e.row.id); this.form.patchValue({ name:e.row.name, description:e.row.description ?? '', taxIds:(e.row.taxes ?? []).map(t=>t.taxId) }); this.modal.set(true);} }
  save():void{ const payload={ name:this.form.value.name ?? '', description:this.form.value.description ?? '', taxes:(this.form.value.taxIds ?? []).map((id,idx)=>({taxId:id,sortOrder:idx+1}))}; const req=this.editing()?this.api.update(this.editing()!,payload):this.api.create(payload); req.subscribe(()=>{ this.modal.set(false); this.load(); }); }
}
