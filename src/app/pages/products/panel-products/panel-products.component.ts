// src/app/pages/products/panel-products/panel-products.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
// Asegúrate que las rutas a los componentes de modal sean correctas
import { CreateProductComponent } from '../create-product/create-product.component'; 
import { UpdatedProductComponent } from '../updated-product/updated-product.component';

// Ng-Zorro imports
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzImageModule } from 'ng-zorro-antd/image';


// 🚀 Interfaz para Productos
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  sku: string; // Stock Keeping Unit
  imageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  isDeleted?: boolean;

  // 📦 Campos de Categoría
  categoryId: number;
  categoryName: string;
}

export interface ProductResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-panel-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzPopconfirmModule,
    NzTagModule,
    NzInputModule,
    NzToolTipModule,
    NzSelectModule,
    NzImageModule,
    CreateProductComponent,
    UpdatedProductComponent
  ],
  templateUrl: './panel-products.component.html',
  styleUrls: ['./panel-products.component.css']
})
export class PanelProductsComponent implements OnInit {
  // 🔌 Servicios inyectados
  private router = inject(Router);
  private message = inject(NzMessageService);
  // 🔮 Servicio futuro
  // private productService = inject(ProductService);

  // 📋 Datos de la tabla
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchText = '';
  isLoading = false;
  pageSize = 10;
  isCreateModalVisible = false;

  // 🔍 Filtros adicionales
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';

  isUpdateModalVisible = false;
  selectedProductForEdit: Product | null = null;

  // 🎨 Configuración de UI
  cardTitle = 'Gestión de Productos';
  pageTitle = 'Inventario de Productos';
  pageDescription = 'Administra todos los productos de tu ferretería.';
  createButtonText = 'Nuevo Producto';
  searchPlaceholder = 'Buscar por nombre, SKU, descripción...';

  ngOnInit(): void {
    this.loadProducts();
  }

    onImageError(event: Event): void {
        // Cuando una imagen URL no se carga (por ej. error 404),
        // la reemplazamos por la ruta a nuestro SVG local en la carpeta de assets.
        const element = event.target as HTMLImageElement;
        element.src = 'assets/images/product-svgrepo-com.svg';
    }

  // 📡 Cargar productos
  loadProducts(): void {
    this.isLoading = true;

    // 📦 Simulación actual con datos de ejemplo
    setTimeout(() => {
      try {
        this.products = this.getDefaultProducts();
        this.applyAllFilters();
        this.isLoading = false;
        console.log('💡 Usando datos de productos por defecto');
      } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        this.isLoading = false;
        this.message.error('No se pudieron cargar los productos.');
      }
    }, 1000);
  }

  // 📦 Datos por defecto para productos
  private getDefaultProducts(): Product[] {
    return [
      { id: 101, name: 'Taladro Percutor 1/2" 750W', description: 'Potente taladro para perforaciones en concreto y metal.', price: 1599.99, stock: 25, status: 'available', sku: 'TLD-750W', categoryId: 11, categoryName: 'Herramientas Eléctricas', createdAt: new Date('2024-03-10'), imageUrl: 'https://via.placeholder.com/150' },
      { id: 102, name: 'Juego de 100 Brocas Mixtas', description: 'Incluye brocas para madera, metal y concreto.', price: 499.50, stock: 0, status: 'out_of_stock', sku: 'BRC-100MX', categoryId: 12, categoryName: 'Herramientas Manuales', createdAt: new Date('2024-03-15') },
      { id: 103, name: 'Tornillo para madera 1" (Caja 100pz)', description: 'Tornillos de alta resistencia para todo tipo de madera.', price: 85.00, stock: 500, status: 'available', sku: 'TRN-MAD-1', categoryId: 21, categoryName: 'Tornillería', createdAt: new Date('2024-03-20') },
      { id: 104, name: 'Pintura Vinílica Blanca 19L', description: 'Pintura de alta cubertura para interiores y exteriores.', price: 1250.00, stock: 15, status: 'available', sku: 'PNT-VIN-19L', categoryId: 22, categoryName: 'Pinturas y Acabados', createdAt: new Date('2024-04-01'), imageUrl: 'https://via.placeholder.com/150' },
      { id: 105, name: 'Tubo PVC Hidráulico 1/2" (3m)', description: 'Tubo de PVC para instalaciones de agua fría.', price: 75.50, stock: 120, status: 'available', sku: 'PVC-HID-12', categoryId: 23, categoryName: 'Plomería', createdAt: new Date('2024-04-05') },
      { id: 106, name: 'Cinta Aislante Negra', description: 'Cinta de PVC para aislar cables eléctricos.', price: 25.00, stock: 300, status: 'available', sku: 'CN-AIS-NEG', categoryId: 24, categoryName: 'Material Eléctrico', createdAt: new Date('2024-04-10') },
      { id: 107, name: 'Manguera de Jardín 15m Reforzada', description: 'Manguera flexible y duradera para riego.', price: 350.00, stock: 30, status: 'discontinued', sku: 'MAN-JAR-15M', categoryId: 3, categoryName: 'Jardinería', createdAt: new Date('2024-02-12'), imageUrl: 'https://via.placeholder.com/150' },
    ];
  }

  // 🔍 Aplicar todos los filtros
  private applyAllFilters(): void {
    let filtered = [...this.products];

    // Filtro por búsqueda
    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.categoryName.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por categoría
    if (this.selectedCategory !== 'all') {
      const categoryId = parseInt(this.selectedCategory);
      filtered = filtered.filter(product => product.categoryId === categoryId);
    }

    // Filtro por estado
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === this.selectedStatus);
    }

    this.filteredProducts = filtered;
  }

  // 🔍 Métodos de filtrado
  onSearch(): void { this.applyAllFilters(); }
  onCategoryFilter(): void { this.applyAllFilters(); }
  onStatusFilter(): void { this.applyAllFilters(); }

  // 🎯 Acciones de la tabla
  createProduct(): void { this.isCreateModalVisible = true; }
  onCreateModalVisibleChange(visible: boolean): void { this.isCreateModalVisible = visible; }
  onProductCreated(newProduct: Product): void {
    this.products.push(newProduct);
    this.applyAllFilters();
    this.message.success(`Producto "${newProduct.name}" creado con éxito.`);
  }

  editProduct(id: number): void {
    const productToEdit = this.products.find(p => p.id === id);
    if (productToEdit) {
      this.selectedProductForEdit = { ...productToEdit };
      this.isUpdateModalVisible = true;
    } else {
      this.message.error('No se encontró el producto para editar.');
    }
  }

  onUpdateModalVisibleChange(visible: boolean): void {
    this.isUpdateModalVisible = visible;
    if (!visible) {
      this.selectedProductForEdit = null;
    }
  }

  onProductUpdated(updatedProduct: Product): void {
    const index = this.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this.products[index] = updatedProduct;
      this.applyAllFilters();
      this.message.success(`Producto "${updatedProduct.name}" actualizado.`);
    }
  }

  deleteProduct(id: number): void {
    this.isLoading = true;
    setTimeout(() => {
      this.products = this.products.filter(p => p.id !== id);
      this.applyAllFilters();
      this.message.success('Producto eliminado correctamente.');
      this.isLoading = false;
    }, 500);
  }

  // 🛠️ Métodos helper
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'available': 'green',
      'out_of_stock': 'orange',
      'discontinued': 'red'
    };
    return colorMap[status] || 'default';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'available': 'Disponible',
      'out_of_stock': 'Agotado',
      'discontinued': 'Descontinuado'
    };
    return textMap[status] || status;
  }
  
  // ✅ NUEVO MÉTODO AÑADIDO
  getDeleteConfirmMessage(productName: string): string {
    return `¿Estás seguro de eliminar el producto "${productName}"?`;
  }

  // 🔄 Refrescar datos
  refreshData(): void {
    this.searchText = '';
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';
    this.loadProducts();
  }
}