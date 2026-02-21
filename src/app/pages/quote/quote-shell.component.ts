import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-quote-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  templateUrl: './quote-shell.component.html',
  styleUrls: ['./quote-shell.component.css'],
})
export class QuoteShellComponent {}
