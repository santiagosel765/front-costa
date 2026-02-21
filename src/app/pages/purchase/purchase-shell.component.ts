import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-purchase-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  templateUrl: './purchase-shell.component.html',
  styleUrls: ['./purchase-shell.component.css'],
})
export class PurchaseShellComponent {}
