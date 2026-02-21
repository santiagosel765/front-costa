import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';
import { AuthModuleSummary } from '../../../core/models/auth-admin.models';

@Component({
  standalone: true,
  selector: 'app-module-form',
  template: `
    <nz-page-header
      nzTitle="{{ isEdit() ? 'Editar módulo' : 'Crear módulo' }}"
      nzSubtitle="Define los módulos del core de autenticación."
    ></nz-page-header>

    <div class="auth-edit-wrapper">
      <nz-card nzTitle="Información del módulo" nzBordered="false">
        <form nz-form nzLayout="vertical" [formGroup]="form" (ngSubmit)="submit()">
          <div nz-row nzGutter="16" class="auth-edit-grid">
            <div nz-col nzXs="24" nzSm="12">
              <nz-form-item>
                <nz-form-label nzRequired nzFor="name">Nombre</nz-form-label>
                <nz-form-control nzErrorTip="Requerido">
                  <input id="name" nz-input formControlName="name" />
                </nz-form-control>
              </nz-form-item>
            </div>

            <div nz-col nzXs="24">
              <nz-form-item>
                <nz-form-label nzFor="description">Descripción</nz-form-label>
                <nz-form-control>
                  <input id="description" nz-input formControlName="description" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <div class="auth-edit-actions">
            <button nz-button nzType="default" (click)="cancel()" type="button">Cancelar</button>
            <button nz-button nzType="primary" [disabled]="form.invalid" [nzLoading]="saving()" type="submit">
              {{ isEdit() ? 'Guardar cambios' : 'Crear módulo' }}
            </button>
          </div>
        </form>
      </nz-card>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .ant-page-header { padding-left: 0; padding-right: 0; margin-bottom: 12px; }
      .auth-edit-wrapper { padding: 16px 24px 24px; }
      .auth-edit-grid { margin-top: 8px; }
      .auth-edit-actions { margin-top: 24px; display: flex; justify-content: flex-end; gap: 8px; }
      @media (max-width: 767px) {
        .auth-edit-wrapper { padding: 12px 12px 24px; }
        .auth-edit-actions { justify-content: flex-start; }
      }
    `,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzPageHeaderModule,
    NzCardModule,
    NzGridModule,
  ],
})
export class ModuleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ModulesAdminService);
  private readonly message = inject(NzMessageService);

  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    id: this.fb.control<string | null>(null),
    name: ['', [Validators.required]],
    description: [''],
    status: this.fb.control<number>(1),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.get(id).subscribe((module) => this.form.patchValue(module));
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { id, ...rest } = this.form.getRawValue();
    this.saving.set(true);

    const payload: Partial<AuthModuleSummary> = {
      ...rest,
      status: rest.status ?? 1,
    };
    const request$ = this.isEdit() && id ? this.service.update(id, payload) : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.message.success('Módulo guardado');
        this.router.navigate(['/main/auth'], { queryParams: { tab: 'modules' } });
      },
      error: () => this.message.error('No se pudo guardar el módulo'),
      complete: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.router.navigate(['/main/auth'], { queryParams: { tab: 'modules' } });
  }
}
