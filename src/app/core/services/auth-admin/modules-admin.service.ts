import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { AuthModuleSummary } from '../../models/auth-admin.models';

@Injectable({ providedIn: 'root' })
export class ModulesAdminService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/auth/admin/modules';

  list(): Observable<AuthModuleSummary[]> {
    return this.api.get<AuthModuleSummary[]>(this.base);
  }

  get(id: string): Observable<AuthModuleSummary> {
    return this.api.get<AuthModuleSummary>(`${this.base}/${id}`);
  }

  create(payload: Partial<AuthModuleSummary>): Observable<AuthModuleSummary> {
    return this.api.post<AuthModuleSummary>(this.base, payload);
  }

  update(id: string, payload: Partial<AuthModuleSummary>): Observable<AuthModuleSummary> {
    return this.api.put<AuthModuleSummary>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
