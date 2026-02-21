import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';

// Interfaces para el tipado
export interface Category {
  id?: number;
  name: string;
  description: string;
  status: number;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data?: Category | Category[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly api = inject(ApiService);

  constructor() { }

  /**
   * Guardar una categoría (crear o actualizar según tenga ID o no)
   * @param category - Objeto con los datos de la categoría
   * @returns Observable con la respuesta del servidor
   */
  saveCategory(category: Category): Observable<CategoryResponse> {
    const endpoint = '/v1/inventory/category/save';

    // Log para debug - quitar en producción
    console.log('URL de guardado:', endpoint);
    console.log('Datos enviados:', category);

    return this.api.post<CategoryResponse>(endpoint, category);
  }

  /**
   * Obtener todas las categorías
   * @returns Observable con la lista de categorías
   */
  getCategories(): Observable<CategoryResponse> {
    const endpoint = '/v1/inventory/categories';

    console.log('URL de obtención:', endpoint);

    return this.api.get<CategoryResponse>(endpoint);
  }

  /**
   * Deshabilitar una categoría (basado en tu endpoint)
   * @param id - ID de la categoría a deshabilitar
   * @returns Observable con la respuesta del servidor
   */
  disableCategory(id: number): Observable<CategoryResponse> {
    const endpoint = `/v1/inventory/category/disable?id=${id}`;

    console.log('URL de deshabilitación:', endpoint);

    return this.api.post<CategoryResponse>(endpoint, null);
  }
}
