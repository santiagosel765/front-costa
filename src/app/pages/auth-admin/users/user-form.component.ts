import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { AuthRoleSummary, AuthUserUpsertPayload } from '../../../core/models/auth-admin.models';
import { RolesAdminService } from '../../../core/services/auth-admin/roles-admin.service';
import { UsersAdminService } from '../../../core/services/auth-admin/users-admin.service';
import { SessionStore } from '../../../core/state/session.store';
import { FormShellComponent } from '../../../shared/components/form-shell/form-shell.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-user-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzGridModule,
    NzAlertModule,
    PageHeaderComponent,
    FormShellComponent,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(UsersAdminService);
  private readonly message = inject(NzMessageService);
  private readonly rolesService = inject(RolesAdminService);
  private readonly sessionStore = inject(SessionStore);

  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly roles = signal<AuthRoleSummary[]>([]);
  readonly loadingRoles = signal(false);
  readonly canWrite = this.sessionStore.canWrite('CORE_DE_AUTENTICACION');
  readonly showChangePassword = signal(false);
  readonly apiError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      id: this.fb.control<string | null>(null),
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required]],
      password: ['', [Validators.minLength(8)]],
      confirmPassword: ['', []],
      status: this.fb.control<number>(1),
      roleIds: this.fb.control<string[]>([]),
    },
    { validators: [passwordsMatchValidator] },
  );

  get breadcrumbs() {
    return [
      { label: 'Core de Autenticación', link: '/main/auth' },
      { label: 'Usuarios', link: '/main/auth?tab=users' },
      { label: this.isEdit() ? 'Editar' : 'Nuevo' },
    ];
  }

  ngOnInit(): void {
    this.loadRoles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.get(id).subscribe((user) => this.form.patchValue({ ...user, status: Number(user.statusId ?? user.statusCode ?? user.status ?? 1), password: '', confirmPassword: '', roleIds: user.roleIds ?? [] }));
    } else {
      this.form.controls.password.addValidators([Validators.required]);
      this.form.controls.confirmPassword.addValidators([Validators.required]);
      this.form.updateValueAndValidity();
    }

    if (!this.canWrite) {
      this.form.disable({ emitEvent: false });
    }
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);
    this.rolesService.list().subscribe({
      next: (roles) => this.roles.set(roles ?? []),
      error: () => this.message.error('No se pudieron cargar los roles'),
      complete: () => this.loadingRoles.set(false),
    });
  }

  enablePasswordChange(): void {
    this.showChangePassword.set(true);
    this.form.controls.password.addValidators([Validators.required]);
    this.form.controls.confirmPassword.addValidators([Validators.required]);
    this.form.updateValueAndValidity();
  }

  submit(): void {
    this.apiError.set(null);
    if (!this.canWrite) {
      this.message.info('Tu plan/rol no permite editar usuarios');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { id, password, confirmPassword, ...rest } = this.form.getRawValue();
    this.saving.set(true);

    const payload: AuthUserUpsertPayload = {
      ...rest,
      status: rest.status ?? 1,
      roleIds: rest.roleIds ?? [],
    };

    if ((!this.isEdit() || this.showChangePassword()) && password) {
      payload.password = password;
    }

    const request$ = this.isEdit() && id ? this.service.update(id, payload) : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.message.success('Usuario guardado');
        this.router.navigate(['/main/auth'], { queryParams: { tab: 'users' } });
      },
      error: () => {
        this.apiError.set('No se pudo guardar el usuario. Verifica los datos e intenta nuevamente.');
        this.message.error('No se pudo guardar el usuario');
      },
      complete: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.router.navigate(['/main/auth'], { queryParams: { tab: 'users' } });
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password && !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}
