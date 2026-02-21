import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';

// Interfaces para el tipado
export interface Product {
  id?: number;
  name: string;
  description: string;
  categoryId: number;
  status: number;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data?: Product | Product[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly api = inject(ApiService);

  constructor() { }

  /**
   * Guardar un producto (crear o actualizar según tenga ID o no)
   * @param product - Objeto con los datos del producto
   * @returns Observable con la respuesta del servidor
   */
  saveProduct(product: Product): Observable<ProductResponse> {
    const endpoint = '/v1/inventory/product/save';

    // Log para debug - quitar en producción
    console.log('URL de guardado:', endpoint);
    console.log('Datos enviados:', product);

    return this.api.post<ProductResponse>(endpoint, product);
  }

  /**
   * Obtener todos los productos
   * @returns Observable con la lista de productos
   */
  getProducts(): Observable<ProductResponse> {
    const endpoint = '/v1/inventory/products';

    console.log('URL de obtención:', endpoint);

    return this.api.get<ProductResponse>(endpoint);
  }

  /**
   * Deshabilitar un producto
   * @param id - ID del producto a deshabilitar
   * @returns Observable con la respuesta del servidor
   */
  disableProduct(id: number): Observable<ProductResponse> {
    const endpoint = `/v1/inventory/product/disable?id=${id}`;

    console.log('URL de deshabilitación:', endpoint);

    return this.api.post<ProductResponse>(endpoint, null);
  }
}
