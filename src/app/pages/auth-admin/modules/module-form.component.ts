import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { AuthModuleUpsertPayload } from '../../../core/models/auth-admin.models';
import { ModulesAdminService } from '../../../core/services/auth-admin/modules-admin.service';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-module-form',
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzGridModule, NzSelectModule, PageHeaderComponent, FormShellComponent],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.css',
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

  get breadcrumbs() {
    return [
      { label: 'Core de Autenticación', link: '/main/auth' },
      { label: 'Módulos', link: '/main/auth?tab=modules' },
      { label: this.isEdit() ? 'Editar' : 'Nuevo' },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.get(id).subscribe((module) => this.form.patchValue({ ...module, status: Number(module.statusId ?? module.statusCode ?? module.status ?? 1) }));
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { id, ...rest } = this.form.getRawValue();
    this.saving.set(true);

    const payload: AuthModuleUpsertPayload = { ...rest, status: rest.status ?? 1 };
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
