// login.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { finalize, tap } from 'rxjs/operators';
import { ModulesStore } from '../../core/state/modules.store';

// Imports de ng-zorro
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, // Cambiado de FormsModule a ReactiveFormsModule
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);
  private modulesStore = inject(ModulesStore);
  
  loginForm!: FormGroup;
  isLoading = false;
  passwordVisible = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const credentials: LoginRequest = {
        username: this.loginForm.get('username')?.value,
        password: this.loginForm.get('password')?.value
      };
      
      this.authService
        .login(credentials)
        .pipe(
          tap((response) => {
            console.log('Login exitoso:', response);
            this.authService.saveToken(response.token);
            this.modulesStore.reset();
          }),
          finalize(() => {
            this.isLoading = false;
          }),
        )
        .subscribe({
          next: () => {
            this.message.success('¡Bienvenido!');
            // Redirigir al dashboard o página principal
            this.router.navigate(['/main/welcome']);
          },
          error: (error) => {
            console.error('Error completo:', error);
            console.error('Status:', error.status);
            console.error('Error body:', error.error);

            // Mostrar mensaje de error más específico
            let errorMessage = 'Error al iniciar sesión';

            if (error.status === 401) {
              errorMessage = 'Credenciales incorrectas';
            } else if (error.status === 404) {
              errorMessage = 'Servicio no encontrado';
            } else if (error.status === 500) {
              errorMessage = 'Error interno del servidor';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            this.message.error(errorMessage);
          },
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}