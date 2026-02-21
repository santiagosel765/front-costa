// src/app/pages/categories/create-category/create-category.component.ts
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

// 🚀 Interfaces
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
  selector: 'app-create-category',
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
    NzToolTipModule
  ],
  templateUrl: './create-category.component.html',
  styleUrls: ['./create-category.component.css']
})
export class CreateCategoryComponent implements OnInit {
  // 🔌 Servicios inyectados
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);

  // 📋 Props del modal
  @Input() isVisible = false;
  @Input() parentId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() categoryCreated = new EventEmitter<Category>();

  // 📝 Formulario y datos - INICIALIZADO INMEDIATAMENTE
  categoryForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  parentCategories: CategoryParent[] = [];
  parentSearchText = '';
  filteredParentCategories: CategoryParent[] = [];
  
  // 🎨 Configuración del modal
  modalTitle = 'Nueva Categoría';
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
      parentId: [this.parentId],
      status: [true]
    });
  }

  ngOnInit(): void {
    console.log('🔍 CreateCategory ngOnInit ejecutado');
    console.log('📝 categoryForm ya existe:', this.categoryForm);
    
    this.loadParentCategories();
    this.checkRouteParams();
    
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
    this.route.queryParams.subscribe(params => {
      if (params['parentId']) {
        this.parentId = parseInt(params['parentId']);
        this.categoryForm.patchValue({ parentId: this.parentId });
        this.updateModalTitle();
      }
    });
  }

  // 🏷️ Actualizar título del modal
  private updateModalTitle(): void {
    if (this.parentId) {
      const parent = this.parentCategories.find(p => p.id === this.parentId);
      this.modalTitle = parent 
        ? `Nueva Subcategoría - ${parent.name}`
        : 'Nueva Subcategoría';
    }
  }

  // 💾 Guardar categoría
  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSubmitting = true;

      const newCategory: Category = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: this.categoryForm.get('name')?.value.trim(),
        description: this.categoryForm.get('description')?.value.trim(),
        status: this.categoryForm.get('status')?.value ? 'active' : 'inactive',
        parentId: this.categoryForm.get('parentId')?.value || null,
        level: this.categoryForm.get('parentId')?.value ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        productsCount: 0,
        createdBy: 'admin'
      };

      console.log('📝 Datos de categoría a crear:', newCategory);

      // Simulación de guardado
      setTimeout(() => {
        this.message.success('Categoría creada exitosamente');
        this.categoryCreated.emit(newCategory);
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
    this.categoryForm.patchValue({ 
      parentId: null,
      status: true 
    });
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