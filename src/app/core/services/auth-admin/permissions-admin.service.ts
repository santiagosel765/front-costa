import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RoleModulesDto } from '../../models/auth-admin.models';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class PermissionsAdminService {
  private readonly api = inject(ApiService);

  getRoleModules(roleId: string): Observable<RoleModulesDto> {
    const params = new HttpParams().set('roleId', roleId);
    return this.api.get<RoleModulesDto>('/v1/auth/admin/role-modules', { params });
  }

  updateRoleModules(roleId: string, moduleIds: string[]): Observable<RoleModulesDto> {
    return this.api.put<RoleModulesDto>(`/v1/auth/admin/role-modules/${roleId}`, { moduleIds });
  }
}
