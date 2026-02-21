import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { ModuleLicenseDTO } from '../../models/auth-admin.models';

@Injectable({ providedIn: 'root' })
export class LicensesAdminService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/auth/admin/module-licenses';

  list(): Observable<ModuleLicenseDTO[]> {
    return this.api.get<ModuleLicenseDTO[]>(this.base);
  }

  create(payload: ModuleLicenseDTO): Observable<ModuleLicenseDTO> {
    return this.api.post<ModuleLicenseDTO>(this.base, payload);
  }
}
