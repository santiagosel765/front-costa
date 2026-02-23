import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs/operators';

import { AuthService, LoginRequest } from '../../services/auth.service';
import { AuthContextService } from '../../core/services/auth-context.service';
import { SessionStore } from '../../core/state/session.store';
import { mapHttpErrorMessage } from '../../core/utils/api-error.util';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private authContextService = inject(AuthContextService);
  private sessionStore = inject(SessionStore);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);

  loginForm!: FormGroup;
  isLoading = false;
  passwordVisible = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      Object.values(this.loginForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isLoading = true;

    const credentials: LoginRequest = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
    };

    this.authService
      .login(credentials)
      .pipe(
        tap((response) => {
          this.authService.saveToken(response.token);
        }),
        switchMap(() => this.authContextService.loadContext()),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.message.success('¡Bienvenido!');
          this.router.navigateByUrl(this.sessionStore.getPrimaryRoute());
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.status === 401 ? 'Credenciales incorrectas' : mapHttpErrorMessage(error);
          this.message.error(errorMessage);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
