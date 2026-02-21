import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce, shareReplay } from 'rxjs/operators';

import { ApiService } from './api.service';

export interface ModuleDTO {
  id: string;
  name: string;
  description: string;
  status: number;
}

export interface ModulesResponse {
  content: ModuleDTO[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  private readonly api = inject(ApiService);
  private allModules$?: Observable<ModuleDTO[]>;

  getModules(): Observable<ModulesResponse> {
    return this.api.get<ModulesResponse>('/v1/auth/modules');
  }

  getAllModules(size = 200): Observable<ModuleDTO[]> {
    if (!this.allModules$) {
      this.allModules$ = this.fetchAllModules(size).pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }

    return this.allModules$;
  }

  clearCache(): void {
    this.allModules$ = undefined;
  }

  private fetchAllModules(size: number): Observable<ModuleDTO[]> {
    // El backend expone el endpoint paginado /v1/auth/modules y responde con
    // PageResponse<ModuleDTO> (content, totalPages, totalElements, page, size).
    // Aquí consumimos todas las páginas en memoria para que el Sidebar y los
    // guards tengan el listado completo de módulos habilitados para el usuario.
    return this.fetchModulesPage(0, size).pipe(
      expand((response) => {
        const currentPage = response.page ?? 0;
        const totalPages = response.totalPages ?? 1;
        const nextPage = currentPage + 1;

        if (nextPage >= totalPages) {
          return EMPTY;
        }

        return this.fetchModulesPage(nextPage, size);
      }),
      map((response) => response?.content ?? []),
      reduce((acc, content) => acc.concat(content), [] as ModuleDTO[]),
    );
  }

  private fetchModulesPage(page: number, size: number): Observable<ModulesResponse> {
    return this.api.get<ModulesResponse>('/v1/auth/modules', {
      params: {
        size,
        page,
      },
    });
  }
}
