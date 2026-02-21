// src/app/pages/inventario/assign-product/assign-product.component.ts
import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ng-Zorro imports
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

// 🚀 Interfaces
export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  brand?: string;
  model?: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
}

export interface StockConfiguration {
  productId: number;
  initialStock: number;
  minimumStock: number;
  notes?: string;
}

export interface AssignedProduct {
  product: Product;
  stockConfig: StockConfiguration;
}

@Component({
  selector: 'app-assign-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzTagModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzSpinModule,
    NzEmptyModule,
    NzToolTipModule
  ],
  templateUrl: './assign-product.component.html',
  styleUrls: ['./assign-product.component.css']
})
export class AssignProductComponent implements OnInit {
  // 🔌 Servicios inyectados
  private message = inject(NzMessageService);

  // 📋 Props del modal
  @Input() isVisible = false;
  @Input() companyId: number | undefined;
  @Input() companyName: string | undefined;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productsAssigned = new EventEmitter<AssignedProduct[]>();

  // 📝 Datos y estado
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  availableCategories: Category[] = [];
  selectedProducts: number[] = [];
  alreadyAssignedProducts: number[] = [];
  stockConfigurations: Map<number, StockConfiguration> = new Map();
  
  // 🔍 Filtros
  searchText = '';
  selectedCategoryFilter: string = 'all';
  selectedStatusFilter: string = 'all';
  showOnlyUnassigned = true;
  
  // 🎯 Estado de UI
  isLoadingProducts = false;
  isSubmitting = false;
  modalTitle = 'Asignar Productos';

  ngOnInit(): void {
    this.loadAvailableProducts();
    this.loadAvailableCategories();
    this.updateModalTitle();
  }

  ngOnChanges(): void {
    this.updateModalTitle();
    if (this.isVisible && this.companyId) {
      this.loadAlreadyAssignedProducts();
    }
  }

  // 📡 Cargar productos disponibles
  loadAvailableProducts(): void {
    this.isLoadingProducts = true;
    
    setTimeout(() => {
      this.allProducts = this.getDefaultProducts();
      this.applyAllFilters();
      this.isLoadingProducts = false;
    }, 800);
  }

  // 📡 Cargar categorías disponibles
  loadAvailableCategories(): void {
    this.availableCategories = [
      { id: 1, name: 'Herramientas Eléctricas' },
      { id: 2, name: 'Herramientas Manuales' },
      { id: 3, name: 'Tornillería' },
      { id: 4, name: 'Pinturas' },
      { id: 5, name: 'Plomería' },
      { id: 6, name: 'Material Eléctrico' },
      { id: 7, name: 'Jardinería' },
      { id: 8, name: 'Seguridad Industrial' }
    ];
  }

  // 📡 Cargar productos ya asignados a la empresa
  loadAlreadyAssignedProducts(): void {
    if (!this.companyId) return;
    
    // Simulación - en la realidad vendría del servicio
    this.alreadyAssignedProducts = [1, 3, 5]; // IDs de productos ya asignados
  }

  // 📦 Datos por defecto de productos
  private getDefaultProducts(): Product[] {
    return [
      {
        id: 1, sku: 'TAL-001', name: 'Taladro Percutor 800W',
        description: 'Taladro con percusión para concreto y mampostería',
        brand: 'Bosch', model: 'GSB 800', categoryId: 1, categoryName: 'Herramientas Eléctricas',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-10')
      },
      {
        id: 2, sku: 'MAR-001', name: 'Martillo Carpintero 16oz',
        description: 'Martillo de carpintero con mango de madera',
        brand: 'Stanley', model: 'STHT0-51034', categoryId: 2, categoryName: 'Herramientas Manuales',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-12')
      },
      {
        id: 3, sku: 'TOR-001', name: 'Tornillos Autorroscantes 3"',
        description: 'Caja de 100 tornillos autorroscantes para madera',
        brand: 'Hilti', categoryId: 3, categoryName: 'Tornillería',
        unit: 'cajas', status: 'active', createdAt: new Date('2024-01-15')
      },
      {
        id: 4, sku: 'PIN-001', name: 'Pintura Látex Blanco 4L',
        description: 'Pintura látex interior color blanco mate',
        brand: 'Sherwin Williams', categoryId: 4, categoryName: 'Pinturas',
        unit: 'galones', status: 'active', createdAt: new Date('2024-01-18')
      },
      {
        id: 5, sku: 'PLO-001', name: 'Tubería PVC 1/2"',
        description: 'Tubería PVC para agua potable 1/2 pulgada',
        brand: 'Pavco', categoryId: 5, categoryName: 'Plomería',
        unit: 'metros', status: 'active', createdAt: new Date('2024-01-20')
      },
      {
        id: 6, sku: 'CAB-001', name: 'Cable Eléctrico 12 AWG',
        description: 'Cable eléctrico calibre 12 AWG para instalaciones',
        brand: 'Centelsa', categoryId: 6, categoryName: 'Material Eléctrico',
        unit: 'metros', status: 'active', createdAt: new Date('2024-01-22')
      },
      {
        id: 7, sku: 'SIE-001', name: 'Sierra Circular 7 1/4"',
        description: 'Sierra circular para madera con disco de 7 1/4 pulgadas',
        brand: 'DeWalt', model: 'DWE575', categoryId: 1, categoryName: 'Herramientas Eléctricas',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-25')
      },
      {
        id: 8, sku: 'DES-001', name: 'Destornillador Phillips #2',
        description: 'Destornillador Phillips número 2 mango ergonómico',
        brand: 'Stanley', categoryId: 2, categoryName: 'Herramientas Manuales',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-28')
      },
      {
        id: 9, sku: 'PIN-002', name: 'Pintura Esmalte Azul 1L',
        description: 'Pintura esmalte sintético color azul brillante',
        brand: 'Pintuco', categoryId: 4, categoryName: 'Pinturas',
        unit: 'litros', status: 'inactive', createdAt: new Date('2024-02-01')
      },
      {
        id: 10, sku: 'JAR-001', name: 'Podadora Manual',
        description: 'Podadora manual para jardín con hoja de acero',
        brand: 'Truper', categoryId: 7, categoryName: 'Jardinería',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-02-05')
      }
    ];
  }

  // 🏷️ Actualizar título del modal
  updateModalTitle(): void {
    this.modalTitle = this.companyName 
      ? `Asignar Productos a ${this.companyName}`
      : 'Asignar Productos';
  }

  // 🔍 Aplicar todos los filtros
  private applyAllFilters(): void {
    let filtered = [...this.allProducts];

    // Filtro por búsqueda
    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.model?.toLowerCase().includes(searchTerm) ||
        product.categoryName.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por categoría
    if (this.selectedCategoryFilter !== 'all') {
      const categoryId = parseInt(this.selectedCategoryFilter);
      filtered = filtered.filter(product => product.categoryId === categoryId);
    }

    // Filtro por estado
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === this.selectedStatusFilter);
    }

    // Filtro por productos no asignados
    if (this.showOnlyUnassigned) {
      filtered = filtered.filter(product => !this.isProductAlreadyAssigned(product.id));
    }

    this.filteredProducts = filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 🔍 Métodos de filtrado
  onSearch(): void {
    this.applyAllFilters();
  }

  onCategoryFilter(): void {
    this.applyAllFilters();
  }

  onStatusFilter(): void {
    this.applyAllFilters();
  }

  onUnassignedFilter(): void {
    this.applyAllFilters();
  }

  // ✅ Gestión de selección de productos
  toggleProductSelection(product: Product, selected: boolean): void {
    if (this.isProductAlreadyAssigned(product.id)) {
      this.message.warning('Este producto ya está asignado a la empresa');
      return;
    }

    if (selected) {
      if (!this.selectedProducts.includes(product.id)) {
        this.selectedProducts.push(product.id);
        this.initializeStockConfig(product.id);
      }
    } else {
      this.selectedProducts = this.selectedProducts.filter(id => id !== product.id);
      this.stockConfigurations.delete(product.id);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts.includes(productId);
  }

  isProductAlreadyAssigned(productId: number): boolean {
    return this.alreadyAssignedProducts.includes(productId);
  }

  // 📋 Gestión de configuración de stock
  initializeStockConfig(productId: number): void {
    if (!this.stockConfigurations.has(productId)) {
      this.stockConfigurations.set(productId, {
        productId,
        initialStock: 0,
        minimumStock: 5,
        notes: ''
      });
    }
  }

  getStockConfig(productId: number): StockConfiguration {
    if (!this.stockConfigurations.has(productId)) {
      this.initializeStockConfig(productId);
    }
    return this.stockConfigurations.get(productId)!;
  }

  // 🎯 Acciones de selección masiva
  selectAllVisible(): void {
    this.filteredProducts.forEach(product => {
      if (!this.isProductAlreadyAssigned(product.id)) {
        this.toggleProductSelection(product, true);
      }
    });
  }

  deselectAllVisible(): void {
    this.filteredProducts.forEach(product => {
      this.toggleProductSelection(product, false);
    });
  }

  clearSelection(): void {
    this.selectedProducts = [];
    this.stockConfigurations.clear();
  }

  removeFromSelection(productId: number): void {
    this.selectedProducts = this.selectedProducts.filter(id => id !== productId);
    this.stockConfigurations.delete(productId);
  }

  // 🛠️ Métodos helper
  getProductById(productId: number): Product | undefined {
    return this.allProducts.find(p => p.id === productId);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getOkButtonText(): string {
    return this.selectedProducts.length > 0 
      ? `Asignar ${this.selectedProducts.length} producto(s)`
      : 'Asignar productos';
  }

  getProductStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'active': 'green',
      'inactive': 'orange',
      'discontinued': 'red'
    };
    return colorMap[status] || 'default';
  }

  getProductStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'discontinued': 'Descontinuado'
    };
    return textMap[status] || status;
  }

  // 💾 Guardar asignación
  onSubmit(): void {
    if (this.selectedProducts.length === 0) {
      this.message.warning('Selecciona al menos un producto para asignar');
      return;
    }

    // Validar configuraciones de stock
    const invalidConfigs = Array.from(this.stockConfigurations.values()).filter(config => 
      config.initialStock < 0 || config.minimumStock < 0
    );

    if (invalidConfigs.length > 0) {
      this.message.warning('Las cantidades de stock no pueden ser negativas');
      return;
    }

    this.isSubmitting = true;

    // Preparar datos para envío
    const assignedProducts: AssignedProduct[] = this.selectedProducts.map(productId => {
      const product = this.getProductById(productId)!;
      const stockConfig = this.getStockConfig(productId);
      
      return {
        product,
        stockConfig
      };
    });

    console.log('📝 Productos a asignar:', assignedProducts);

    // Simulación de guardado
    setTimeout(() => {
      this.message.success(`${assignedProducts.length} productos asignados correctamente a ${this.companyName}`);
      this.productsAssigned.emit(assignedProducts);
      this.closeModal();
      this.isSubmitting = false;
    }, 1500);
  }

  // ❌ Cerrar modal
  closeModal(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
    this.clearSelection();
    this.searchText = '';
    this.selectedCategoryFilter = 'all';
    this.selectedStatusFilter = 'all';
    this.showOnlyUnassigned = true;
  }

  // 🔄 Cancelar
  onCancel(): void {
    this.closeModal();
  }
}