import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule],
  templateUrl: './inventory-shell.component.html',
  styleUrls: ['./inventory-shell.component.css'],
})
export class InventoryShellComponent {}
