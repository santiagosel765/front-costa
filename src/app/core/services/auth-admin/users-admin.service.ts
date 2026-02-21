import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { AuthUserSummary, UserRoleAssignment } from '../../models/auth-admin.models';

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/auth/admin/users';

  list(): Observable<AuthUserSummary[]> {
    return this.api.get<AuthUserSummary[]>(this.base);
  }

  get(id: string): Observable<AuthUserSummary> {
    return this.api.get<AuthUserSummary>(`${this.base}/${id}`);
  }

  create(payload: Partial<AuthUserSummary>): Observable<AuthUserSummary> {
    return this.api.post<AuthUserSummary>(this.base, payload);
  }

  update(id: string, payload: Partial<AuthUserSummary>): Observable<AuthUserSummary> {
    return this.api.put<AuthUserSummary>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }

  assignRole(payload: UserRoleAssignment): Observable<void> {
    return this.api.post<void>('/v1/auth/admin/user-roles', payload);
  }
}
