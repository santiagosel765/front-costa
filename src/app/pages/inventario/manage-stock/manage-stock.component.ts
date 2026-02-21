// src/app/pages/inventario/manage-stock/manage-stock.component.ts
import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Ng-Zorro imports
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

// 🚀 Interfaces (reutilizando las del panel de inventario)
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

export interface StockMovement {
  id?: number;
  inventoryItemId: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

@Component({
  selector: 'app-manage-stock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzTagModule,
    NzRadioModule,
    NzToolTipModule
  ],
  templateUrl: './manage-stock.component.html',
  styleUrls: ['./manage-stock.component.css']
})
export class ManageStockComponent implements OnInit, OnChanges {
  // 🔌 Servicios inyectados
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  // 📋 Props del modal
  @Input() isVisible = false;
  @Input() inventoryItem: InventoryItem | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() stockUpdated = new EventEmitter<InventoryItem>();

  // 📝 Formulario y estado
  stockForm: FormGroup;
  isSubmitting = false;
  modalTitle = 'Gestionar Stock';
  hasChanges = false;

  constructor() {
    // 🔧 Inicializar formulario inmediatamente
    this.stockForm = this.fb.group({
      movementType: ['in', [Validators.required]],
      quantity: [0, [
        Validators.required,
        Validators.min(0.01),
        this.quantityValidator.bind(this)
      ]],
      reason: ['', [Validators.required]],
      newMinimumStock: [0, [Validators.min(0)]],
      newMaximumStock: [0, [Validators.min(0)]],
      notes: ['', [Validators.maxLength(500)]]
    });

    // Suscribirse a cambios del formulario
    this.stockForm.valueChanges.subscribe(() => {
      this.hasChanges = this.checkForChanges();
    });
  }

  ngOnInit(): void {
    this.updateModalTitle();
  }

  ngOnChanges(): void {
    this.updateModalTitle();
    if (this.inventoryItem) {
      this.initializeForm();
    }
  }

  // 🏷️ Actualizar título del modal
  updateModalTitle(): void {
    if (this.inventoryItem) {
      this.modalTitle = `Gestionar Stock - ${this.inventoryItem.product.name}`;
    } else {
      this.modalTitle = 'Gestionar Stock';
    }
  }

  // 🔧 Inicializar formulario con datos del item
  initializeForm(): void {
    if (!this.inventoryItem) return;

    this.stockForm.patchValue({
      movementType: 'in',
      quantity: 0,
      reason: '',
      newMinimumStock: this.inventoryItem.minimumStock,
      newMaximumStock: this.inventoryItem.maximumStock || 0,
      notes: ''
    });

    this.hasChanges = false;
  }

  // 🔍 Validador personalizado para cantidad
  quantityValidator(control: any) {
    if (!this.inventoryItem || !control.value) return null;

    const movementType = this.stockForm?.get('movementType')?.value;
    const quantity = control.value;

    if (movementType === 'out' && quantity > this.inventoryItem.currentStock) {
      return { insufficientStock: true };
    }

    return null;
  }

  // 🔄 Verificar si hay cambios
  checkForChanges(): boolean {
    if (!this.inventoryItem) return false;

    const formValues = this.stockForm.value;
    
    return formValues.quantity > 0 ||
           formValues.reason !== '' ||
           formValues.newMinimumStock !== this.inventoryItem.minimumStock ||
           formValues.newMaximumStock !== (this.inventoryItem.maximumStock || 0) ||
           formValues.notes !== '';
  }

  // 📊 Calcular stock resultante
  getResultingStock(): number {
    if (!this.inventoryItem) return 0;

    const movementType = this.stockForm.get('movementType')?.value;
    const quantity = this.stockForm.get('quantity')?.value || 0;
    const currentStock = this.inventoryItem.currentStock;

    switch (movementType) {
      case 'in':
        return currentStock + quantity;
      case 'out':
        return currentStock - quantity;
      case 'adjustment':
        return quantity; // En ajuste, la cantidad es el stock final
      default:
        return currentStock;
    }
  }

  // 📏 Obtener cantidad máxima permitida
  getMaxQuantity(): number {
    if (!this.inventoryItem) return 999999;

    const movementType = this.stockForm.get('movementType')?.value;
    
    if (movementType === 'out') {
      return this.inventoryItem.currentStock;
    }
    
    return 999999;
  }

  // 🎯 Getters para controles del formulario
  get quantityControl() { return this.stockForm.get('quantity'); }
  get reasonControl() { return this.stockForm.get('reason'); }

  // 🛠️ Métodos helper para validaciones
  getQuantityErrorMessage(): string {
    const control = this.quantityControl;
    if (control?.hasError('required')) {
      return 'La cantidad es requerida';
    }
    if (control?.hasError('min')) {
      return 'La cantidad debe ser mayor a 0';
    }
    if (control?.hasError('insufficientStock')) {
      return 'No hay suficiente stock disponible';
    }
    return '';
  }

  getReasonErrorMessage(): string {
    const control = this.reasonControl;
    if (control?.hasError('required')) {
      return 'Debes especificar una razón para el movimiento';
    }
    return '';
  }

  // 📏 Contar caracteres de notas
  getNotesLength(): number {
    return this.stockForm.get('notes')?.value?.length || 0;
  }

  // 🛠️ Métodos helper para colores y textos
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

  getMovementTypeText(type: string): string {
    const textMap: { [key: string]: string } = {
      'in': 'Entrada de',
      'out': 'Salida de',
      'adjustment': 'Ajuste a'
    };
    return textMap[type] || type;
  }

  getReasonText(reason: string): string {
    const reasonMap: { [key: string]: string } = {
      // Entradas
      'purchase': 'Compra/Reposición',
      'return': 'Devolución de cliente',
      'transfer_in': 'Transferencia desde otra empresa',
      'production': 'Producción interna',
      'initial_stock': 'Inventario inicial',
      'other_in': 'Otros',
      
      // Salidas
      'sale': 'Venta',
      'damaged': 'Producto dañado',
      'expired': 'Producto vencido',
      'transfer_out': 'Transferencia a otra empresa',
      'theft': 'Robo/Pérdida',
      'sample': 'Muestra/Demostración',
      'other_out': 'Otros',
      
      // Ajustes
      'recount': 'Reconteo físico',
      'system_error': 'Error del sistema',
      'audit': 'Auditoría',
      'correction': 'Corrección contable',
      'other_adjustment': 'Otros'
    };
    return reasonMap[reason] || reason;
  }

  // 💾 Guardar cambios
  onSubmit(): void {
    if (!this.inventoryItem || this.stockForm.invalid) {
      this.message.warning('Por favor, completa todos los campos requeridos');
      return;
    }

    // Validaciones adicionales
    const resultingStock = this.getResultingStock();
    if (resultingStock < 0) {
      this.message.error('El stock resultante no puede ser negativo');
      return;
    }

    const newMinStock = this.stockForm.get('newMinimumStock')?.value;
    const newMaxStock = this.stockForm.get('newMaximumStock')?.value;
    
    if (newMaxStock > 0 && newMinStock > newMaxStock) {
      this.message.error('El stock mínimo no puede ser mayor al stock máximo');
      return;
    }

    this.isSubmitting = true;
    const formValues = this.stockForm.value;

    // Crear movimiento de stock
    const movement: StockMovement = {
      inventoryItemId: this.inventoryItem.id,
      type: formValues.movementType,
      quantity: formValues.quantity,
      previousStock: this.inventoryItem.currentStock,
      newStock: resultingStock,
      reason: formValues.reason,
      notes: formValues.notes || undefined,
      createdAt: new Date(),
      createdBy: 'admin' // En la realidad vendría del usuario logueado
    };

    // Actualizar item de inventario
    const updatedItem: InventoryItem = {
      ...this.inventoryItem,
      currentStock: resultingStock,
      minimumStock: newMinStock,
      maximumStock: newMaxStock > 0 ? newMaxStock : undefined,
      stockStatus: this.calculateNewStockStatus(resultingStock, newMinStock),
      lastUpdated: new Date(),
      updatedBy: 'admin',
      notes: formValues.notes || this.inventoryItem.notes
    };

    console.log('📝 Movimiento de stock:', movement);
    console.log('📦 Item actualizado:', updatedItem);

    // Simulación de guardado
    setTimeout(() => {
      this.message.success('Stock actualizado correctamente');
      this.stockUpdated.emit(updatedItem);
      this.closeModal();
      this.isSubmitting = false;
    }, 1500);
  }

  // 📊 Calcular nuevo estado de stock
  private calculateNewStockStatus(newStock: number, minStock: number): 'available' | 'low' | 'critical' | 'out' {
    if (newStock === 0) return 'out';
    if (newStock <= minStock * 0.5) return 'critical';
    if (newStock <= minStock) return 'low';
    return 'available';
  }

  // ❌ Cerrar modal
  closeModal(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
    this.stockForm.reset();
    this.hasChanges = false;
    this.initializeForm();
  }

  // 🔄 Cancelar
  onCancel(): void {
    if (this.hasChanges) {
      // En una implementación real, podrías mostrar un confirm
      console.log('Cambios descartados');
    }
    this.closeModal();
  }
}