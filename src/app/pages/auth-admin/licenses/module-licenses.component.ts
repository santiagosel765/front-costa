import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { LicensesAdminService } from '../../../core/services/auth-admin/licenses-admin.service';
import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';
import { ModuleLicenseDTO, AuthModuleSummary } from '../../../core/models/auth-admin.models';

@Component({
  standalone: true,
  selector: 'app-module-licenses',
  template: `
    <div class="page-header">
      <div>
        <h2>Licencias de módulos</h2>
        <p class="subtitle">Configura disponibilidad por tenant.</p>
      </div>
    </div>

    <nz-card nzBordered>
      <form nz-form [formGroup]="form" (ngSubmit)="create()" class="form">
      <label nz-form-item>
        <span nz-form-label>Tenant</span>
        <nz-form-control nzErrorTip="Requerido">
          <input nz-input formControlName="tenantId" />
        </nz-form-control>
      </label>
      <label nz-form-item>
        <span nz-form-label>Módulo</span>
        <nz-form-control nzErrorTip="Requerido">
          <select nz-input formControlName="moduleId">
            <option *ngFor="let module of modules()" [value]="module.id">{{ module.name }}</option>
          </select>
        </nz-form-control>
      </label>
      <label nz-form-item>
        <span nz-form-label>Activo</span>
        <nz-form-control>
          <label nz-switch formControlName="enabled"></label>
        </nz-form-control>
      </label>
      <label nz-form-item>
        <span nz-form-label>Expira</span>
        <nz-form-control>
          <nz-date-picker formControlName="expiresAt" nzFormat="yyyy-MM-dd"></nz-date-picker>
        </nz-form-control>
      </label>
      <div class="actions">
        <button nz-button nzType="primary" [disabled]="form.invalid" type="submit">Agregar</button>
      </div>
      </form>

      <nz-table [nzData]="licenses()" nzBordered [nzLoading]="loading()" class="mt">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Módulo</th>
            <th>Estado</th>
            <th>Expira</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let license of licenses()">
            <td class="text-strong">{{ license.tenantId }}</td>
            <td>{{ resolveModule(license.moduleId)?.name || license.moduleId }}</td>
            <td>
              <nz-tag [nzColor]="license.enabled ? 'green' : 'default'">
                {{ license.enabled ? 'Habilitado' : 'Deshabilitado' }}
              </nz-tag>
            </td>
            <td>{{ license.expiresAt || 'Sin expiración' }}</td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [
    `
      .form { max-width: 640px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
      .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .subtitle { color: #6b7280; margin: 0; }
      .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
      .mt { margin-top: 16px; }
      .text-strong { font-weight: 600; }
    `,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzCardModule,
    NzTagModule,
  ],
})
export class ModuleLicensesComponent implements OnInit {
  private readonly licensesService = inject(LicensesAdminService);
  private readonly modulesService = inject(ModulesAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  readonly licenses = signal<ModuleLicenseDTO[]>([]);
  readonly modules = signal<AuthModuleSummary[]>([]);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    tenantId: ['', [Validators.required]],
    moduleId: ['', [Validators.required]],
    enabled: this.fb.control<boolean>(true),
    expiresAt: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.reload();
    this.modulesService.list().subscribe((modules) => this.modules.set(modules));
  }

  resolveModule(moduleId: string): AuthModuleSummary | undefined {
    return this.modules().find((m) => m.id === moduleId);
  }

  reload(): void {
    this.loading.set(true);
    this.licensesService.list().subscribe({
      next: (licenses) => this.licenses.set(licenses ?? []),
      error: () => this.message.error('No se pudieron cargar las licencias'),
      complete: () => this.loading.set(false),
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { tenantId, moduleId, enabled, expiresAt } = this.form.getRawValue();
    const payload: ModuleLicenseDTO = {
      tenantId,
      moduleId,
      enabled: enabled ?? false,
      expiresAt: expiresAt ?? null,
    };
    this.licensesService.create(payload).subscribe({
      next: () => {
        this.message.success('Licencia creada');
        this.reload();
      },
      error: () => this.message.error('No se pudo crear la licencia'),
    });
  }
}
