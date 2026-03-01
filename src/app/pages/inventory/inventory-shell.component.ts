import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule, RouterLink, RouterOutlet],
  templateUrl: './inventory-shell.component.html',
  styleUrls: ['./inventory-shell.component.css'],
})
export class InventoryShellComponent {}
