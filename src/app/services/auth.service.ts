import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { SessionStore } from '../core/state/session.store';

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
  private readonly sessionStore = inject(SessionStore);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/v1/auth/login', credentials);
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.api.post<void>('/v1/auth/change-password', payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.api.post<void>('/v1/auth/reset-password', payload);
  }

  saveToken(token: string): void {
    this.sessionStore.setToken(token);
  }

  getToken(): string | null {
    return this.sessionStore.getToken();
  }

  isAuthenticated(): boolean {
    return this.sessionStore.isAuthenticated();
  }

  logout(): void {
    this.sessionStore.clearSession();
  }
}
