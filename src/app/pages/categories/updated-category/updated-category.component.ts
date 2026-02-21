// src/app/pages/categories/update-category/update-category.component.ts
import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Ng-Zorro imports
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// 🚀 Interfaces (usar las mismas del create)
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
  
  // Campos para jerarquía
  parentId?: number | null;
  parentName?: string;
  level?: number;
  hasChildren?: boolean;
  childrenCount?: number;
  fullPath?: string;
}

export interface CategoryParent {
  id: number;
  name: string;
  level: number;
}

@Component({
  selector: 'app-update-category',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzToolTipModule,
    NzSpinModule
  ],
  templateUrl: './updated-category.component.html',
  styleUrls: ['./updated-category.component.css']
})
export class UpdatedCategoryComponent implements OnInit {
  // 🔌 Servicios inyectados
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);

  // 📋 Props del modal
  @Input() isVisible = false;
  @Input() categoryId: number | null = null;
  @Input() categoryData: Category | null = null; // Datos de la categoría a editar
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() categoryUpdated = new EventEmitter<Category>();

  // 📝 Formulario y datos
  categoryForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  parentCategories: CategoryParent[] = [];
  parentSearchText = '';
  filteredParentCategories: CategoryParent[] = [];
  isUpdateModalVisible = false;
  selectedCategoryForEdit: Category | null = null;
  
  // 🎨 Configuración del modal
  modalTitle = 'Editar Categoría';
  modalWidth = 600;

  constructor() {
    // 🔧 Inicializar formulario INMEDIATAMENTE en el constructor
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s\-\_\.]+$/)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      parentId: [null],
      status: [true]
    });
  }

  ngOnInit(): void {
    console.log('🔍 UpdateCategory ngOnInit ejecutado');
    console.log('📝 categoryForm ya existe:', this.categoryForm);
    console.log('📊 categoryData recibida:', this.categoryData);
    
    this.loadParentCategories();
    this.checkRouteParams();
    
    // Si tenemos datos de categoría, cargar en el formulario
    if (this.categoryData) {
      this.loadCategoryData(this.categoryData);
    } else if (this.categoryId) {
      this.loadCategoryById(this.categoryId);
    }
    
    console.log('✅ ngOnInit completado');
  }

  // 📡 Cargar categorías padre disponibles
  private loadParentCategories(): void {
    this.parentCategories = [
      { id: 1, name: 'Herramientas', level: 0 },
      { id: 2, name: 'Materiales de Construcción', level: 0 },
      { id: 3, name: 'Jardinería', level: 0 },
      { id: 4, name: 'Fontanería', level: 0 },
      { id: 5, name: 'Electricidad', level: 0 },
      { id: 6, name: 'Seguridad', level: 0 }
    ];
    
    this.filteredParentCategories = [...this.parentCategories];
  }

  // 📥 Cargar datos de categoría por ID
  private loadCategoryById(id: number): void {
    this.isLoading = true;
    
    // 🔮 FUTURO: Llamada real al servicio
    /*
    this.categoryService.getCategoryById(id).subscribe({
      next: (category) => {
        this.loadCategoryData(category);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.message.error('Error al cargar la categoría');
        this.isLoading = false;
      }
    });
    */

    // 📦 Simulación con datos de ejemplo
    setTimeout(() => {
      const mockCategory: Category = {
        id: id,
        name: 'Categoría de Ejemplo',
        description: 'Esta es una descripción de ejemplo para la categoría que se está editando.',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-10'),
        productsCount: 25,
        parentId: 1,
        level: 1,
        createdBy: 'admin'
      };
      
      this.loadCategoryData(mockCategory);
      this.isLoading = false;
    }, 1000);
  }

  // 📝 Cargar datos en el formulario
  private loadCategoryData(category: Category): void {
    console.log('📝 Cargando datos en formulario:', category);
    
    this.categoryData = category;
    this.modalTitle = `Editar: ${category.name}`;
    
    // Cargar datos en el formulario
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      status: category.status === 'active'
    });
  }

  // 🔍 Filtrar categorías padre
  filterParentCategories(): void {
    if (!this.parentSearchText.trim()) {
      this.filteredParentCategories = [...this.parentCategories];
    } else {
      const searchTerm = this.parentSearchText.toLowerCase();
      this.filteredParentCategories = this.parentCategories.filter(parent =>
        parent.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  // 🔍 Verificar parámetros de ruta
  private checkRouteParams(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = parseInt(params['id']);
        console.log('📋 ID de categoría desde ruta:', this.categoryId);
      }
    });
  }

  // 💾 Actualizar categoría
  onSubmit(): void {
    if (this.categoryForm.valid && this.categoryData) {
      this.isSubmitting = true;

      const updatedCategory: Category = {
        ...this.categoryData, // Mantener datos originales
        name: this.categoryForm.get('name')?.value.trim(),
        description: this.categoryForm.get('description')?.value.trim(),
        status: this.categoryForm.get('status')?.value ? 'active' : 'inactive',
        parentId: this.categoryForm.get('parentId')?.value || null,
        level: this.categoryForm.get('parentId')?.value ? 1 : 0,
        updatedAt: new Date()
      };

      console.log('📝 Datos de categoría a actualizar:', updatedCategory);

      // 🔮 FUTURO: Llamada al servicio
      /*
      this.categoryService.updateCategory(updatedCategory.id, updatedCategory).subscribe({
        next: (response) => {
          this.message.success('Categoría actualizada exitosamente');
          this.categoryUpdated.emit(response);
          this.closeModal();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.message.error('Error al actualizar la categoría');
          this.isSubmitting = false;
        }
      });
      */

      // 📦 Simulación actual
      setTimeout(() => {
        this.message.success('Categoría actualizada exitosamente');
        this.categoryUpdated.emit(updatedCategory);
        this.closeModal();
        this.isSubmitting = false;
      }, 1500);

    } else {
      this.markFormGroupTouched();
      this.message.warning('Por favor, completa todos los campos requeridos');
    }
  }

  // 🔴 Marcar campos como tocados para mostrar errores
  private markFormGroupTouched(): void {
    Object.values(this.categoryForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  // ❌ Cerrar modal
  closeModal(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
    this.categoryForm.reset();
    this.categoryData = null;
    this.modalTitle = 'Editar Categoría';
  }

  // 🔄 Cancelar
  onCancel(): void {
    this.closeModal();
  }

  // 🎯 Getters para validaciones del formulario
  get nameControl() { return this.categoryForm.get('name'); }
  get descriptionControl() { return this.categoryForm.get('description'); }

  // 🛠️ Métodos helper para validaciones
  getNameErrorMessage(): string {
    const control = this.nameControl;
    if (control?.hasError('required')) {
      return 'El nombre es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    if (control?.hasError('maxlength')) {
      return 'El nombre no puede exceder 100 caracteres';
    }
    if (control?.hasError('pattern')) {
      return 'El nombre contiene caracteres no válidos';
    }
    return '';
  }

  getDescriptionErrorMessage(): string {
    const control = this.descriptionControl;
    if (control?.hasError('required')) {
      return 'La descripción es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La descripción debe tener al menos 10 caracteres';
    }
    if (control?.hasError('maxlength')) {
      return 'La descripción no puede exceder 500 caracteres';
    }
    return '';
  }

  // 📏 Contar caracteres
  getDescriptionLength(): number {
    return this.categoryForm.get('description')?.value?.length || 0;
  }
}