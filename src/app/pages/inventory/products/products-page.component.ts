import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { InvProduct, InvProductService } from '../../../services/inv/inv-product.service';
import { MstAttribute, MstAttributeService } from '../../../services/mst/mst-attribute.service';
import { MstBrandService } from '../../../services/mst/mst-brand.service';
import { MstCategoryService } from '../../../services/mst/mst-category.service';
import { MstTaxProfileService } from '../../../services/mst/mst-tax-profile.service';
import { MstUomService } from '../../../services/mst/mst-uom.service';
import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableStateService } from '../../../shared/table/table-state.service';

@Component({ selector: 'app-inv-products-page', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule, NzCardModule, NzButtonModule, NzInputModule, NzModalModule, NzSelectModule, NzTabsModule, NzSwitchModule, AppDataTableComponent, HasPermissionDirective], templateUrl: './products-page.component.html', providers: [TableStateService] })
export class ProductsPageComponent implements OnInit {
  private readonly api = inject(InvProductService); private readonly catApi = inject(MstCategoryService); private readonly brandApi = inject(MstBrandService); private readonly uomApi = inject(MstUomService); private readonly taxApi = inject(MstTaxProfileService); private readonly attrApi = inject(MstAttributeService); private readonly fb = inject(FormBuilder); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly msg = inject(NzMessageService); readonly table = inject(TableStateService);
  readonly rows = signal<InvProduct[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly modal = signal(false); readonly saving = signal(false); readonly editing = signal<string | null>(null);
  readonly categories = signal<Array<{id:string;name:string}>>([]); readonly brands = signal<Array<{id:string;name:string}>>([]); readonly uoms = signal<Array<{id:string;name:string}>>([]); readonly profiles = signal<Array<{id:string;name:string}>>([]); readonly attributes = signal<MstAttribute[]>([]);
  readonly attrValues = signal<Record<string, unknown>>({});
  readonly form = this.fb.group({ type: ['PRODUCT', Validators.required], status: ['DRAFT', Validators.required], sku: [''], name: ['', Validators.required], categoryId: [null as string | null], brandId: [null as string | null], uomId: [null as string | null], trackStock: [false], trackLot: [false], trackSerial: [false], basePrice: [0], taxProfileId: [null as string | null] });
  readonly filters = this.fb.group({ categoryId: [null as string | null], brandId: [null as string | null], type: [null as string | null], status: [null as string | null] });
  readonly columns: AppDataTableColumn<InvProduct>[] = [{ key:'sku', title:'SKU' },{ key:'name',title:'Nombre'},{ key:'type',title:'Tipo'},{ key:'status',title:'Estado',cellType:'tag',tagColor:r=>r.status==='ACTIVE'?'green':r.status==='ARCHIVED'?'default':'blue',tagText:r=>r.status },{ key:'actions',title:'Acciones',cellType:'actions',actions:[{type:'edit',label:'Editar',icon:'edit'},{type:'delete',label:'Eliminar',icon:'delete',danger:true,confirmTitle:'¿Eliminar producto?'}]}];
  ngOnInit(): void { this.table.init(this.route, { page:1, size:10 }); this.table.state$.subscribe(()=>this.load()); this.loadCatalogs(); this.filters.valueChanges.subscribe(()=>this.load()); }
  loadCatalogs(): void { this.catApi.list({ page:1,size:300 }).subscribe(r=>this.categories.set(r.data.map(v=>({id:v.id,name:v.name})))); this.brandApi.list({page:1,size:300}).subscribe(r=>this.brands.set(r.data.map(v=>({id:v.id,name:v.name})))); this.uomApi.listUnits({page:1,size:300}).subscribe(r=>this.uoms.set(r.data.map(v=>({id:v.id,name:v.name})))); this.taxApi.list({page:1,size:300}).subscribe(r=>this.profiles.set(r.data.map(v=>({id:v.id,name:v.name})))); this.attrApi.list({page:1,size:300}).subscribe(r=>this.attributes.set(r.data)); }
  load(): void { this.loading.set(true); this.api.list({ ...this.table.snapshot, ...this.filters.getRawValue() }).subscribe({ next:r=>{ this.rows.set(r.data); this.total.set(r.total); }, complete:()=>this.loading.set(false) }); }
  onPageChange(v:{pageIndex:number;pageSize:number}):void{ this.table.patch(this.router,{page:v.pageIndex,size:v.pageSize}); }
  onSearchChange(q:string):void{ this.table.patch(this.router,{q,page:1}); }
  openCreate():void{ this.editing.set(null); this.form.reset({ type:'PRODUCT',status:'DRAFT',sku:'',name:'',categoryId:null,brandId:null,uomId:null,trackStock:false,trackLot:false,trackSerial:false,basePrice:0,taxProfileId:null }); this.attrValues.set({}); this.modal.set(true); }
  action(e:{type:'edit'|'delete'|'custom';row:InvProduct}):void{ if(e.type==='delete') this.api.remove(e.row.id).subscribe(()=>this.load()); if(e.type==='edit'){ this.editing.set(e.row.id); this.form.patchValue(e.row); this.modal.set(true);} }
  setAttr(code:string,val:unknown):void{ this.attrValues.set({ ...this.attrValues(), [code]: val }); }
  save():void{ const v=this.form.getRawValue() as any; if(v.status==='ACTIVE' && !v.categoryId){ this.msg.warning('Categoría requerida cuando está ACTIVO'); return; } if((v.type==='PRODUCT'||v.type==='KIT') && !v.uomId){ this.msg.warning('UOM requerida para PRODUCT/KIT'); return; } this.saving.set(true); const req=this.editing()?this.api.update(this.editing()!,v):this.api.create(v); req.subscribe({ next:(p)=>{ const id=this.editing() ?? p.id; if(id){ this.api.updateAttributes(id,this.attrValues()).subscribe(); } this.msg.success('Producto guardado'); this.modal.set(false); this.load(); }, error:()=>this.msg.error('Error al guardar producto'), complete:()=>this.saving.set(false) }); }
}
