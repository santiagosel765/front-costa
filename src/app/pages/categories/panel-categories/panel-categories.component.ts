// src/app/pages/categories/panel-categories/panel-categories.component.ts (Mejorado)
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { UpdatedCategoryComponent } from '../updated-category/updated-category.component';

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


// 🚀 Interfaces mejoradas para jerarquía
export interface Category {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
  productsCount: number;
  createdBy?: string;
  isDeleted?: boolean;
  
  // 🆕 Campos para jerarquía
  parentId?: number | null;
  parentName?: string;
  level?: number;
  hasChildren?: boolean;
  childrenCount?: number;
  fullPath?: string;
}

export interface CategoryResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-panel-categories',
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
    CreateCategoryComponent,
    UpdatedCategoryComponent
    
  ],
  templateUrl: './panel-categories.component.html',
  styleUrls: ['./panel-categories.component.css']
})
export class PanelCategoriesComponent implements OnInit {
  // 🔌 Servicios inyectados
  private router = inject(Router);
  private message = inject(NzMessageService);
  // 🔮 Servicio futuro
  // private categoryService = inject(CategoryService);

  // 📋 Datos de la tabla
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchText = '';
  isLoading = false;
  pageSize = 10;
  isCreateModalVisible = false;

  // 🔍 Filtros adicionales
  selectedLevel: string = 'all';
  selectedStatus: string = 'all';

  isUpdateModalVisible = false;
  selectedCategoryForEdit: Category | null = null;

  // 🎨 Configuración de UI
  cardTitle = 'Gestión de Categorías';
  pageTitle = 'Lista de Categorías';
  pageDescription = 'Administra las categorías y subcategorías de tu ferretería';
  createButtonText = 'Nueva Categoría';
  searchPlaceholder = 'Buscar categorías...';

  ngOnInit(): void {
    this.loadCategories();
  }

  // 📡 Cargar categorías con jerarquía
  loadCategories(): void {
    this.isLoading = true;
    
    // 🔮 FUTURO: Integración con servicio real
    /*
    this.categoryService.getCategoriesWithHierarchy().pipe(
      catchError(error => {
        console.error('Error loading categories:', error);
        this.message.error('Error al cargar las categorías');
        return of({ data: this.getDefaultCategories(), total: 0, page: 1, limit: 10 });
      }),
      finalize(() => this.isLoading = false)
    ).subscribe((response: CategoryResponse) => {
      this.categories = this.processHierarchy(response.data);
      this.filteredCategories = [...this.categories];
    });
    */

    // 📦 Simulación actual con datos mejorados
    setTimeout(() => {
      try {
        const serviceData = this.getDataFromService();
        
        if (serviceData && serviceData.length > 0) {
          this.categories = this.processHierarchy(serviceData);
        } else {
          this.categories = this.processHierarchy(this.getDefaultCategories());
          console.log('💡 Usando datos por defecto con jerarquía');
        }
        
        this.applyAllFilters();
        this.isLoading = false;
      } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        this.categories = this.processHierarchy(this.getDefaultCategories());
        this.applyAllFilters();
        this.isLoading = false;
        this.message.warning('Usando datos por defecto - servicio no disponible');
      }
    }, 1000);
  }

  // 🔮 Placeholder para servicio
  private getDataFromService(): Category[] | null {
    // 🚀 FUTURO: Llamada real al servicio
    return null;
  }

  // 📦 Datos por defecto con jerarquía
  private getDefaultCategories(): Category[] {
    return [
      // 🏠 CATEGORÍAS PRINCIPALES (level 0)
      {
        id: 1,
        name: 'Herramientas',
        description: 'Todas las herramientas de trabajo y construcción',  
        status: 'active',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        productsCount: 0, // Se calculará
        createdBy: 'admin',
        parentId: null,
        level: 0,
        hasChildren: true
      },
      {
        id: 2,
        name: 'Materiales de Construcción',
        description: 'Materiales básicos para construcción y reparación',
        status: 'active',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-18'),
        productsCount: 0,
        createdBy: 'admin',
        parentId: null,
        level: 0,
        hasChildren: true
      },
      {
        id: 3,
        name: 'Jardinería',
        description: 'Herramientas y productos para jardinería y paisajismo',
        status: 'active',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-20'),
        productsCount: 75,
        createdBy: 'admin',
        parentId: null,
        level: 0,
        hasChildren: false
      },

      // 🔧 SUBCATEGORÍAS DE HERRAMIENTAS (level 1)
      {
        id: 11,
        name: 'Herramientas Eléctricas',
        description: 'Taladros, sierras, lijadoras y demás herramientas que requieren energía eléctrica',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        productsCount: 45,
        createdBy: 'admin',
        parentId: 1,
        level: 1
      },
      {
        id: 12,
        name: 'Herramientas Manuales',
        description: 'Martillos, destornilladores, llaves y herramientas de mano',
        status: 'active',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-22'),
        productsCount: 89,
        createdBy: 'admin',
        parentId: 1,
        level: 1
      },
      {
        id: 13,
        name: 'Herramientas de Medición',
        description: 'Metros, niveles, escuadras y instrumentos de medición',
        status: 'active',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-23'),
        productsCount: 32,
        createdBy: 'admin',
        parentId: 1,
        level: 1
      },

      // 🧱 SUBCATEGORÍAS DE MATERIALES (level 1)
      {
        id: 21,
        name: 'Tornillería',
        description: 'Tornillos, tuercas, arandelas y elementos de fijación',
        status: 'active',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
        productsCount: 238,
        createdBy: 'admin',
        parentId: 2,
        level: 1
      },
      {
        id: 22,
        name: 'Pinturas y Acabados',
        description: 'Pinturas, barnices, esmaltes y productos para acabados',
        status: 'inactive',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15'),
        productsCount: 67,
        createdBy: 'admin',
        parentId: 2,
        level: 1
      },
      {
        id: 23,
        name: 'Plomería',
        description: 'Tuberías, llaves, conexiones y accesorios hidráulicos',
        status: 'active',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-10'),
        productsCount: 156,
        createdBy: 'admin',
        parentId: 2,
        level: 1
      },
      {
        id: 24,
        name: 'Material Eléctrico',
        description: 'Cables, interruptores, tomacorrientes y material eléctrico',
        status: 'active',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-20'),
        productsCount: 89,
        createdBy: 'admin',
        parentId: 2,
        level: 1
      }
    ];
  }

  // 🔄 Procesar jerarquía y calcular datos derivados
  private processHierarchy(categories: Category[]): Category[] {
    // Crear mapa para búsqueda rápida
    const categoryMap = new Map<number, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    // Procesar cada categoría
    return categories.map(category => {
      const processed = { ...category };

      // Para categorías padre: calcular productos y subcategorías
      if (processed.level === 0) {
        const children = categories.filter(c => c.parentId === processed.id);
        processed.childrenCount = children.length;
        processed.hasChildren = children.length > 0;
        
        // Sumar productos de subcategorías
        const childrenProducts = children.reduce((sum, child) => sum + child.productsCount, 0);
        processed.productsCount = processed.productsCount + childrenProducts;
      }

      // Para subcategorías: agregar información del padre
      if (processed.level === 1 && processed.parentId) {
        const parent = categoryMap.get(processed.parentId);
        if (parent) {
          processed.parentName = parent.name;
          processed.fullPath = `${parent.name} > ${processed.name}`;
        }
      }

      return processed;
    }).sort((a, b) => {
      // Ordenar: primero padres, luego hijos por padre
      if (a.level !== b.level) {
        return a.level! - b.level!;
      }
      if (a.level === 1 && b.level === 1) {
        if (a.parentId !== b.parentId) {
          return a.parentId! - b.parentId!;
        }
      }
      return a.name.localeCompare(b.name);
    });
  }

  // 🔍 Aplicar todos los filtros
  private applyAllFilters(): void {
    let filtered = [...this.categories];

    // Filtro por búsqueda
    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm) ||
        category.description.toLowerCase().includes(searchTerm) ||
        category.parentName?.toLowerCase().includes(searchTerm) ||
        category.fullPath?.toLowerCase().includes(searchTerm) ||
        category.id.toString().includes(searchTerm)
      );
    }

    // Filtro por nivel
    if (this.selectedLevel !== 'all') {
      const level = parseInt(this.selectedLevel);
      filtered = filtered.filter(category => category.level === level);
    }

    // Filtro por estado
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(category => category.status === this.selectedStatus);
    }

    this.filteredCategories = filtered;
  }

  // 🔍 Métodos de filtrado
  onSearch(): void {
    this.applyAllFilters();
  }

  onLevelFilter(): void {
    this.applyAllFilters();
  }

  onStatusFilter(): void {
    this.applyAllFilters();
  }

  // 🎯 Acciones de la tabla
  createCategory(): void {
  console.log('🎯 createCategory llamado');
  this.isCreateModalVisible = true;
  console.log('📖 isCreateModalVisible:', this.isCreateModalVisible);
}

onCreateModalVisibleChange(visible: boolean): void {
  console.log('👁️ Modal visibility changed:', visible);
  this.isCreateModalVisible = visible;
}

  onCategoryCreated(newCategory: Category): void {
    // Agregar la nueva categoría a la lista
    this.categories.push(newCategory);
    this.categories = this.processHierarchy(this.categories);
    this.applyAllFilters();
    console.log('Nueva categoría creada:', newCategory);
  }

editCategory(id: number): void {
  console.log('🎯 editCategory llamado con ID:', id);
  
  // Buscar la categoría por ID
  const categoryToEdit = this.categories.find(c => c.id === id);
  
  if (categoryToEdit) {
    this.selectedCategoryForEdit = categoryToEdit;
    this.isUpdateModalVisible = true;
    console.log('📖 isUpdateModalVisible:', this.isUpdateModalVisible);
    console.log('📝 Categoría seleccionada:', this.selectedCategoryForEdit);
  } else {
    this.message.error('No se encontró la categoría seleccionada');
  }
}

// Agregar métodos para manejar el modal de edición
onUpdateModalVisibleChange(visible: boolean): void {
  console.log('👁️ Update Modal visibility changed:', visible);
  this.isUpdateModalVisible = visible;
  if (!visible) {
    this.selectedCategoryForEdit = null;
  }
}

onCategoryUpdated(updatedCategory: Category): void {
  // Actualizar la categoría en la lista
  const index = this.categories.findIndex(c => c.id === updatedCategory.id);
  if (index !== -1) {
    this.categories[index] = updatedCategory;
    this.categories = this.processHierarchy(this.categories);
    this.applyAllFilters();
    console.log('Categoría actualizada:', updatedCategory);
  }
}

  viewCategory(id: number): void {
    this.message.info(`Ver detalles de categoría ID: ${id}`);
  }

  deleteCategory(id: number): void {
    const category = this.categories.find(c => c.id === id);
    
    if (category?.hasChildren) {
      this.message.warning('No se puede eliminar una categoría que tiene subcategorías');
      return;
    }

    this.isLoading = true;
    
    // 🔮 FUTURO: Llamada al servicio
    setTimeout(() => {
      this.categories = this.categories.filter(cat => cat.id !== id);
      this.categories = this.processHierarchy(this.categories);
      this.applyAllFilters();
      this.message.success('Categoría eliminada correctamente');
      this.isLoading = false;
    }, 500);
  }

  // 🛠️ Métodos helper
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'active': 'green',
      'inactive': 'red',
      'pending': 'orange'
    };
    return colorMap[status] || 'default';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'pending': 'Pendiente'
    };
    return textMap[status] || status;
  }

  getDeleteConfirmMessage(category: Category): string {
    if (category.hasChildren) {
      return `Esta categoría tiene ${category.childrenCount} subcategorías. No se puede eliminar.`;
    }
    return `¿Estás seguro de eliminar la categoría "${category.name}"?`;
  }

  // 🔄 Refrescar datos
  refreshData(): void {
    this.searchText = '';
    this.selectedLevel = 'all';
    this.selectedStatus = 'all';
    this.loadCategories();
  }
}