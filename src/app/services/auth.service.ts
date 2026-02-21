/* auth.service.ts */
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../core/services/api.service';

// Interfaces para el tipado
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: UserSummary;
  expiresIn?: number;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  status?: number;
  roleNames?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  usernameOrEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);

  constructor() { }

  /**
   * Método para autenticar usuario y obtener token
   * @param credentials - Objeto con username y password
   * @returns Observable con la respuesta del servidor
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/v1/auth/login', credentials);
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.api.post<void>('/v1/auth/change-password', payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.api.post<void>('/v1/auth/reset-password', payload);
  }

  /**
   * Método para guardar el token en localStorage
   * @param token - Token JWT a guardar
   */
  saveToken(token: string): void {
    sessionStorage.setItem('authToken', token);
  }

  /**
   * Método para obtener el token guardado
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  /**
   * Método para verificar si el usuario está autenticado
   * @returns true si existe un token, false en caso contrario
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Método para cerrar sesión (eliminar token)
   */
  logout(): void {
    sessionStorage.removeItem('authToken');
  }
}
