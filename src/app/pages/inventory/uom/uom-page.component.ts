import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { MstUomService, UomConversion, UomGroup, UomUnit } from '../../../services/mst/mst-uom.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({ selector: 'app-mst-uom-page', standalone: true, imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzTabsModule, NzButtonModule, NzModalModule, NzInputModule, NzSwitchModule, NzSelectModule, HasPermissionDirective], templateUrl: './uom-page.component.html' })
export class UomPageComponent implements OnInit {
  private readonly api = inject(MstUomService); private readonly fb = inject(FormBuilder); private readonly msg = inject(NzMessageService);
  readonly groups = signal<UomGroup[]>([]); readonly units = signal<UomUnit[]>([]); readonly conversions = signal<UomConversion[]>([]);
  readonly loading = signal(false); readonly tab = signal(0); readonly modal = signal(false); readonly saving = signal(false); readonly editingId = signal<string | null>(null);
  readonly groupForm = this.fb.group({ name: ['', Validators.required], code: [''] });
  readonly unitForm = this.fb.group({ groupId: [null as string | null, Validators.required], name: ['', Validators.required], symbol: ['', Validators.required], isBase: [false] });
  readonly convForm = this.fb.group({ groupId: [null as string | null, Validators.required], fromUomId: [null as string | null, Validators.required], toUomId: [null as string | null, Validators.required], factor: [1, [Validators.required, Validators.min(0.000001)]] });
  ngOnInit(): void { this.refresh(); }
  refresh(): void { this.loading.set(true); this.api.listGroups({ page: 1, size: 100 }).subscribe(r => { this.groups.set(r.data); this.loading.set(false); }); this.api.listUnits({ page: 1, size: 200 }).subscribe(r => this.units.set(r.data)); this.api.listConversions({ page: 1, size: 200 }).subscribe(r => this.conversions.set(r.data)); }
  openCreate(tab: number): void { this.tab.set(tab); this.editingId.set(null); this.modal.set(true); }
  save(): void { const t = this.tab(); const request = (t === 0 ? this.api.createGroup(this.groupForm.getRawValue() as any) : t === 1 ? this.api.createUnit(this.unitForm.getRawValue() as Partial<UomUnit>) : this.api.createConversion(this.convForm.getRawValue() as Partial<UomConversion>)) as any; this.saving.set(true); request.subscribe({ next: () => { this.msg.success('Guardado'); this.modal.set(false); this.refresh(); }, error: () => this.msg.error('Error al guardar'), complete: () => this.saving.set(false) }); }
}
