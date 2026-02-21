// src/app/pages/products/create-product/create-product.component.ts
import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

// Ng-Zorro imports
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';
// ✅ 1. IMPORTAR EL MÓDULO DE UPLOAD
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

// 🚀 Interfaz Actualizada
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  sku: string;
  // ✅ 2. CAMPOS DE IMAGEN ACTUALIZADOS
  featuredImageUrl?: string;
  galleryImageUrls?: string[];
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  categoryId: number;
  categoryName: string;
}

export interface ProductCategory {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-product',
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
    NzInputNumberModule,
    NzGridModule,
    // ✅ 3. AÑADIR NzUploadModule A LOS IMPORTS
    NzUploadModule
  ],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnInit {
  // ... (Servicios y Props sin cambios) ...
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  @Input() isVisible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productCreated = new EventEmitter<Product>();

  // Formulario y Datos
  productForm: FormGroup;
  isSubmitting = false;
  availableCategories: ProductCategory[] = [];
  
  // Configuración del Modal
  modalTitle = 'Nuevo Producto';
  modalWidth = 800; // Más ancho para la galería

  // ✅ 4. PROPIEDADES PARA UPLOADERS
  featuredImageFile: NzUploadFile[] = [];
  galleryImageFiles: NzUploadFile[] = [];

  // Formateadores de moneda
  formatterPeso = (value: number | null): string => value === null ? '' : `Q ${value}`;
  parserPeso = (value: string): number => parseFloat(value.replace('Q ', ''));

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      sku: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-]+$/)]],
      categoryId: [null, [Validators.required]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      // ✅ 5. AÑADIR CONTROLES PARA LAS IMÁGENES
      featuredImage: [null, Validators.required], // Para validar que se subió una imagen
      galleryImages: [[]]
    });
  }

  ngOnInit(): void {
    this.loadAvailableCategories();
  }
  
  private loadAvailableCategories(): void {
    this.availableCategories = [
      { id: 11, name: 'Herramientas Eléctricas' },
      { id: 12, name: 'Herramientas Manuales' },
      { id: 21, name: 'Tornillería' },
    ];
  }

  //  6. MANEJADOR PARA LA IMAGEN DESTACADA
  beforeUploadFeatured = (file: NzUploadFile): boolean => {
    // ... (código existente sin cambios) ...
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      this.message.error('Solo puedes subir imágenes JPG o PNG.');
      return false;
    }
    this.featuredImageFile = [file];
    this.productForm.patchValue({ featuredImage: file });
    this.productForm.get('featuredImage')?.markAsDirty();
    return false;
  };

  handleFeaturedRemove = (): boolean => {
  this.featuredImageFile = [];
  this.productForm.patchValue({ featuredImage: null });
  return true; // Retorna true para confirmar la eliminación
};


  // ✅ 7. MANEJADOR PARA LA GALERÍA
  beforeUploadGallery = (file: NzUploadFile): boolean => {
    // ... (código existente sin cambios) ...
    this.galleryImageFiles = this.galleryImageFiles.concat(file);
    this.productForm.patchValue({ galleryImages: this.galleryImageFiles });
    this.productForm.get('galleryImages')?.markAsDirty();
    return false;
  };

  handleGalleryRemove = (file: NzUploadFile): boolean => {
    this.galleryImageFiles = this.galleryImageFiles.filter(f => f.uid !== file.uid);
    this.productForm.patchValue({ galleryImages: this.galleryImageFiles });
    return true; 
  };

  onSubmit(): void {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      
      const formValues = this.productForm.value;
      const selectedCategory = this.availableCategories.find(c => c.id === formValues.categoryId);

      // 🔮 SIMULACIÓN: En una app real, aquí subirías los archivos a un servidor
      // y obtendrías las URLs. Por ahora, usaremos placeholders.
      const featuredImageUrl = `assets/uploads/${(formValues.featuredImage as NzUploadFile).name}`;
      const galleryImageUrls = (formValues.galleryImages as NzUploadFile[]).map(file => `assets/uploads/${file.name}`);

      const newProduct: Product = {
        id: Math.floor(Math.random() * 1000) + 200,
        name: formValues.name.trim(),
        sku: formValues.sku.trim().toUpperCase(),
        price: formValues.price,
        stock: formValues.stock,
        description: formValues.description.trim(),
        categoryId: formValues.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : 'Desconocida',
        status: formValues.stock > 0 ? 'available' : 'out_of_stock',
        // ✅ 8. ASIGNAR LAS URLs SIMULADAS
        featuredImageUrl: featuredImageUrl,
        galleryImageUrls: galleryImageUrls,
        createdAt: new Date(),
        createdBy: 'admin'
      };

      setTimeout(() => {
        this.message.success(`Producto "${newProduct.name}" creado exitosamente.`);
        this.productCreated.emit(newProduct);
        this.closeModal();
        this.isSubmitting = false;
      }, 1500);

    } else {
      this.markFormGroupTouched();
      this.message.warning('Por favor, completa todos los campos requeridos correctamente.');
    }
  }

  private markFormGroupTouched(): void {
    Object.values(this.productForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  closeModal(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
    setTimeout(() => {
        this.productForm.reset({ price: null, stock: 0 });
        // ✅ 9. LIMPIAR LAS LISTAS DE ARCHIVOS
        this.featuredImageFile = [];
        this.galleryImageFiles = [];
    }, 300);
  }

  onCancel(): void {
    this.closeModal();
  }
}