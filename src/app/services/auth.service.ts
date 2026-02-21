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
  // Agrega otros campos que devuelva tu API
  user?: any;
  expiresIn?: number;
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
    const endpoint = '/v1/auth/login';

    // Log para debug - quitar en producción
    console.log('URL de login:', endpoint);
    console.log('Credenciales enviadas:', credentials);

    return this.api.post<LoginResponse>(endpoint, credentials);
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
