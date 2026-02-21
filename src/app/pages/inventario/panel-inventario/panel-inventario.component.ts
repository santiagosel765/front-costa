// src/app/pages/inventario/panel-inventario/panel-inventario.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Importar componentes modales
import { AssignProductComponent } from '../assign-product/assign-product.component';
import { ManageStockComponent } from '../manage-stock/manage-stock.component';

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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

// 🚀 Interfaces para inventario
export interface Company {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  assignedProductsCount: number;
  totalStock: number;
  criticalProducts: number;
}

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

export interface InventoryItem {
  id: number;
  companyId: number;
  productId: number;
  product: Product;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  stockStatus: 'available' | 'low' | 'critical' | 'out';
  lastUpdated: Date;
  updatedBy: string;
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface StockMovement {
  id: number;
  inventoryItemId: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

@Component({
  selector: 'app-panel-inventario',
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
    NzTabsModule,
    NzStatisticModule,
    NzEmptyModule,
    AssignProductComponent,
    ManageStockComponent
  ],
  templateUrl: './panel-inventario.component.html',
  styleUrls: ['./panel-inventario.component.css']
})
export class PanelInventarioComponent implements OnInit {
  // 🔌 Servicios inyectados
  private message = inject(NzMessageService);

  // 📋 Datos principales
  companies: Company[] = [];
  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  availableCategories: Category[] = [];
  
  // 🎯 Estado de UI
  selectedCompanyIndex = 0;
  searchText = '';
  selectedCategory: string = 'all';
  selectedStockStatus: string = 'all';
  isLoading = false;
  pageSize = 10;
  
  // 🎭 Estado de modales
  isAssignModalVisible = false;
  isStockModalVisible = false;
  selectedInventoryItem: InventoryItem | null = null;

  ngOnInit(): void {
    this.loadInitialData();
  }

  // 📡 Cargar datos iniciales
  loadInitialData(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      try {
        this.companies = this.getDefaultCompanies();
        this.availableCategories = this.getDefaultCategories();
        this.inventory = this.getDefaultInventory();
        this.applyAllFilters();
        this.isLoading = false;
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        this.message.error('Error al cargar los datos del inventario');
        this.isLoading = false;
      }
    }, 1000);
  }

  // 📦 Datos por defecto - Empresas
  private getDefaultCompanies(): Company[] {
    return [
      {
        id: 1,
        name: 'Empresa 1',
        status: 'active',
        assignedProductsCount: 15,
        totalStock: 450,
        criticalProducts: 2
      },
      {
        id: 2,
        name: 'Empresa 2',
        status: 'active',
        assignedProductsCount: 23,
        totalStock: 680,
        criticalProducts: 1
      },
      {
        id: 3,
        name: 'Empresa 3',
        status: 'inactive',
        assignedProductsCount: 8,
        totalStock: 120,
        criticalProducts: 0
      }
    ];
  }

  // 📦 Datos por defecto - Categorías
  private getDefaultCategories(): Category[] {
    return [
      { id: 1, name: 'Herramientas Eléctricas' },
      { id: 2, name: 'Herramientas Manuales' },
      { id: 3, name: 'Tornillería' },
      { id: 4, name: 'Pinturas' },
      { id: 5, name: 'Plomería' },
      { id: 6, name: 'Material Eléctrico' }
    ];
  }

  // 📦 Datos por defecto - Inventario
  private getDefaultInventory(): InventoryItem[] {
    const baseProducts: Product[] = [
      {
        id: 1, sku: 'TAL-001', name: 'Taladro Percutor 800W', description: 'Taladro con percusión para concreto',
        brand: 'Bosch', model: 'GSB 800', categoryId: 1, categoryName: 'Herramientas Eléctricas',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-10')
      },
      {
        id: 2, sku: 'MAR-001', name: 'Martillo Carpintero 16oz', description: 'Martillo de carpintero mango de madera',
        brand: 'Stanley', model: 'STHT0-51034', categoryId: 2, categoryName: 'Herramientas Manuales',
        unit: 'unidades', status: 'active', createdAt: new Date('2024-01-12')
      },
      {
        id: 3, sku: 'TOR-001', name: 'Tornillos Autorroscantes 3"', description: 'Caja de tornillos autorroscantes',
        brand: 'Hilti', categoryId: 3, categoryName: 'Tornillería',
        unit: 'cajas', status: 'active', createdAt: new Date('2024-01-15')
      },
      {
        id: 4, sku: 'PIN-001', name: 'Pintura Látex Blanco 4L', description: 'Pintura látex interior blanco',
        brand: 'Sherwin Williams', categoryId: 4, categoryName: 'Pinturas',
        unit: 'galones', status: 'active', createdAt: new Date('2024-01-18')
      },
      {
        id: 5, sku: 'PLO-001', name: 'Tubería PVC 1/2"', description: 'Tubería PVC presión 1/2 pulgada',
        brand: 'Pavco', categoryId: 5, categoryName: 'Plomería',
        unit: 'metros', status: 'active', createdAt: new Date('2024-01-20')
      }
    ];

    const inventory: InventoryItem[] = [];
    
    // Crear inventario para cada empresa
    this.companies.forEach(company => {
      const productsPerCompany = Math.floor(Math.random() * 3) + 3; // 3-5 productos por empresa
      
      for (let i = 0; i < productsPerCompany; i++) {
        const product = baseProducts[i % baseProducts.length];
        const currentStock = Math.floor(Math.random() * 100) + 1;
        const minimumStock = Math.floor(Math.random() * 10) + 5;
        
        let stockStatus: 'available' | 'low' | 'critical' | 'out';
        if (currentStock === 0) {
          stockStatus = 'out';
        } else if (currentStock <= minimumStock * 0.5) {
          stockStatus = 'critical';
        } else if (currentStock <= minimumStock) {
          stockStatus = 'low';
        } else {
          stockStatus = 'available';
        }

        inventory.push({
          id: inventory.length + 1,
          companyId: company.id,
          productId: product.id,
          product: { ...product },
          currentStock,
          minimumStock,
          maximumStock: minimumStock * 5,
          stockStatus,
          lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedBy: 'admin',
          notes: Math.random() > 0.7 ? 'Producto con rotación alta' : undefined
        });
      }
    });

    return inventory;
  }

  // 🏢 Obtener empresa activa
  getActiveCompany(): Company | undefined {
    return this.companies[this.selectedCompanyIndex];
  }

  // 🔄 Cambio de empresa
  onCompanyChange(): void {
    this.searchText = '';
    this.selectedCategory = 'all';
    this.selectedStockStatus = 'all';
    this.applyAllFilters();
  }

  // 🔍 Aplicar todos los filtros
  private applyAllFilters(): void {
    const activeCompany = this.getActiveCompany();
    if (!activeCompany) {
      this.filteredInventory = [];
      return;
    }

    let filtered = this.inventory.filter(item => item.companyId === activeCompany.id);

    // Filtro por búsqueda
    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm) ||
        item.product.sku.toLowerCase().includes(searchTerm) ||
        item.product.categoryName.toLowerCase().includes(searchTerm) ||
        item.product.brand?.toLowerCase().includes(searchTerm) ||
        item.product.model?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por categoría
    if (this.selectedCategory !== 'all') {
      const categoryId = parseInt(this.selectedCategory);
      filtered = filtered.filter(item => item.product.categoryId === categoryId);
    }

    // Filtro por estado de stock
    if (this.selectedStockStatus !== 'all') {
      filtered = filtered.filter(item => item.stockStatus === this.selectedStockStatus);
    }

    this.filteredInventory = filtered.sort((a, b) => {
      // Ordenar por estado de stock (críticos primero) y luego por nombre
      const statusOrder = { 'critical': 0, 'out': 1, 'low': 2, 'available': 3 };
      const statusDiff = statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
      if (statusDiff !== 0) return statusDiff;
      return a.product.name.localeCompare(b.product.name);
    });
  }

  // 🔍 Métodos de filtrado
  onSearch(): void {
    this.applyAllFilters();
  }

  onCategoryFilter(): void {
    this.applyAllFilters();
  }

  onStockStatusFilter(): void {
    this.applyAllFilters();
  }

  // 📊 Métodos de estadísticas
  getTotalStock(): number {
    const activeCompany = this.getActiveCompany();
    if (!activeCompany) return 0;
    
    return this.inventory
      .filter(item => item.companyId === activeCompany.id)
      .reduce((total, item) => total + item.currentStock, 0);
  }

  getCriticalStockCount(): number {
    const activeCompany = this.getActiveCompany();
    if (!activeCompany) return 0;
    
    return this.inventory
      .filter(item => item.companyId === activeCompany.id && 
                     (item.stockStatus === 'critical' || item.stockStatus === 'out'))
      .length;
  }

  // 🎯 Acciones de modales
  openAssignProductModal(): void {
    this.isAssignModalVisible = true;
  }

  onAssignModalVisibleChange(visible: boolean): void {
    this.isAssignModalVisible = visible;
  }

  onProductsAssigned(assignedProducts: any[]): void {
    // Lógica para agregar productos asignados al inventario
    console.log('Productos asignados:', assignedProducts);
    this.message.success(`${assignedProducts.length} productos asignados correctamente`);
    this.loadInitialData(); // Recargar datos
  }

  openStockModal(item: InventoryItem): void {
    this.selectedInventoryItem = item;
    this.isStockModalVisible = true;
  }

  onStockModalVisibleChange(visible: boolean): void {
    this.isStockModalVisible = visible;
    if (!visible) {
      this.selectedInventoryItem = null;
    }
  }

  onStockUpdated(updatedItem: InventoryItem): void {
    // Actualizar el item en la lista
    const index = this.inventory.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      this.inventory[index] = updatedItem;
      this.applyAllFilters();
      console.log('Stock actualizado:', updatedItem);
    }
  }

  // 🛠️ Acciones de la tabla
  viewStockHistory(inventoryItemId: number): void {
    this.message.info(`Ver historial de movimientos para item ${inventoryItemId}`);
  }

  removeFromCompany(inventoryItemId: number): void {
    this.isLoading = true;
    
    setTimeout(() => {
      this.inventory = this.inventory.filter(item => item.id !== inventoryItemId);
      this.applyAllFilters();
      this.message.success('Producto removido de la empresa');
      this.isLoading = false;
    }, 500);
  }

  // 🛠️ Métodos helper para colores y textos
  getCompanyStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'active': 'green',
      'inactive': 'red'
    };
    return colorMap[status] || 'default';
  }

  getCompanyStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'active': 'Activa',
      'inactive': 'Inactiva'
    };
    return textMap[status] || status;
  }

  getStockStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'available': 'green',
      'low': 'orange',
      'critical': 'red',
      'out': 'red'
    };
    return colorMap[status] || 'default';
  }

  getStockStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'available': 'Disponible',
      'low': 'Stock Bajo',
      'critical': 'Crítico',
      'out': 'Sin Stock'
    };
    return textMap[status] || status;
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

  // 🔄 Refrescar datos
  refreshData(): void {
    this.searchText = '';
    this.selectedCategory = 'all';
    this.selectedStockStatus = 'all';
    this.loadInitialData();
  }
}