// src/app/pages/products/updated-product/updated-product.component.ts
import { Component, OnChanges, SimpleChanges, inject, Input, Output, EventEmitter } from '@angular/core';
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
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

// 🚀 Interfaces (las mismas que en create-product)
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  sku: string;
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
  selector: 'app-updated-product',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, NzModalModule, NzFormModule,
    NzInputModule, NzButtonModule, NzSelectModule, NzIconModule, NzInputNumberModule,
    NzGridModule, NzUploadModule, NzSpinModule, NzTagModule
  ],
  templateUrl: './updated-product.component.html',
  styleUrls: ['./updated-product.component.css']
})
export class UpdatedProductComponent implements OnChanges {
  // 🔌 Servicios
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  // 📋 Props del Modal
  @Input() isVisible = false;
  @Input() productData: Product | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productUpdated = new EventEmitter<Product>();

  // 📝 Formulario y Datos
  productForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  availableCategories: ProductCategory[] = [];
  
  // Propiedades para Uploaders
  featuredImageFile: NzUploadFile[] = [];
  galleryImageFiles: NzUploadFile[] = [];
  
  // 🎨 Configuración del Modal
  modalTitle = 'Editar Producto';
  modalWidth = 800;

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
      featuredImage: [null, Validators.required],
      galleryImages: [[]]
    });
  }

  // 🔄 Detectar cambios en los datos de entrada
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] && this.productData) {
      this.isLoading = true;
      this.loadAvailableCategories();
      // Simular carga de datos
      setTimeout(() => {
        this.loadProductData(this.productData!);
        this.isLoading = false;
      }, 500);
    }
  }

  // 📝 Cargar datos en el formulario
  private loadProductData(product: Product): void {
    this.modalTitle = `Editar: ${product.name}`;
    
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock,
      description: product.description,
    });

    // Cargar imagen destacada existente
    if (product.featuredImageUrl) {
      this.featuredImageFile = [{
        uid: '-1',
        name: 'featured_image.png',
        status: 'done',
        url: product.featuredImageUrl
      }];
      this.productForm.patchValue({ featuredImage: this.featuredImageFile[0] });
    }

    // Cargar galería existente
    if (product.galleryImageUrls && product.galleryImageUrls.length > 0) {
      this.galleryImageFiles = product.galleryImageUrls.map((url, index) => ({
        uid: `${-index - 1}`,
        name: `image_${index}.png`,
        status: 'done',
        url: url
      }));
      this.productForm.patchValue({ galleryImages: this.galleryImageFiles });
    }
  }
  
  private loadAvailableCategories(): void {
    this.availableCategories = [
      { id: 11, name: 'Herramientas Eléctricas' },
      { id: 12, name: 'Herramientas Manuales' },
      { id: 21, name: 'Tornillería' },
    ];
  }

  // Manejadores de subida de archivos (igual que en create)
  beforeUploadFeatured = (file: NzUploadFile): boolean => {
    this.featuredImageFile = [file];
    this.productForm.patchValue({ featuredImage: file });
    return false;
  };
  handleFeaturedRemove = (): boolean => {
  this.featuredImageFile = [];
  this.productForm.patchValue({ featuredImage: null });
  return true; // Retorna true para confirmar la eliminación
};

  beforeUploadGallery = (file: NzUploadFile): boolean => {
    this.galleryImageFiles = [...this.galleryImageFiles, file];
    this.productForm.patchValue({ galleryImages: this.galleryImageFiles });
    return false;
  };

  handleGalleryRemove = (file: NzUploadFile): boolean => {
  this.galleryImageFiles = this.galleryImageFiles.filter(f => f.uid !== file.uid);
  this.productForm.patchValue({ galleryImages: this.galleryImageFiles });
  return true; // Retorna true para confirmar la eliminación
};

  // 💾 Actualizar producto
  onSubmit(): void {
    if (this.productForm.valid && this.productData) {
      this.isSubmitting = true;
      
      const formValues = this.productForm.value;
      
      // Lógica para determinar las URLs finales
      const finalFeaturedUrl = this.featuredImageFile.length > 0
        ? (this.featuredImageFile[0].url || `assets/uploads/${this.featuredImageFile[0].name}`)
        : undefined;
      
      const finalGalleryUrls = this.galleryImageFiles.map(file => 
        file.url || `assets/uploads/${file.name}`
      );

      const updatedProduct: Product = {
        ...this.productData,
        name: formValues.name.trim(),
        sku: formValues.sku.trim().toUpperCase(),
        price: formValues.price,
        stock: formValues.stock,
        description: formValues.description.trim(),
        categoryId: formValues.categoryId,
        status: formValues.stock > 0 ? 'available' : 'out_of_stock',
        featuredImageUrl: finalFeaturedUrl,
        galleryImageUrls: finalGalleryUrls,
        updatedAt: new Date()
      };

      setTimeout(() => {
        this.message.success('Producto actualizado exitosamente.');
        this.productUpdated.emit(updatedProduct);
        this.closeModal();
        this.isSubmitting = false;
      }, 1500);

    } else {
      this.markFormGroupTouched();
      this.message.warning('Por favor, completa todos los campos requeridos.');
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

  // ❌ Cerrar modal
  closeModal(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
    setTimeout(() => {
      this.productForm.reset();
      this.featuredImageFile = [];
      this.galleryImageFiles = [];
      this.modalTitle = 'Editar Producto';
    }, 300);
  }

  onCancel(): void {
    this.closeModal();
  }
}