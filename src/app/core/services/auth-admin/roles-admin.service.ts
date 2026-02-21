import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { AuthRoleSummary } from '../../models/auth-admin.models';

@Injectable({ providedIn: 'root' })
export class RolesAdminService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/auth/admin/roles';

  list(): Observable<AuthRoleSummary[]> {
    return this.api.get<AuthRoleSummary[]>(this.base);
  }

  get(id: string): Observable<AuthRoleSummary> {
    return this.api.get<AuthRoleSummary>(`${this.base}/${id}`);
  }

  create(payload: Partial<AuthRoleSummary>): Observable<AuthRoleSummary> {
    return this.api.post<AuthRoleSummary>(this.base, payload);
  }

  update(id: string, payload: Partial<AuthRoleSummary>): Observable<AuthRoleSummary> {
    return this.api.put<AuthRoleSummary>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
