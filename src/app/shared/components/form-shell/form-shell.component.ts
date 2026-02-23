import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-form-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  templateUrl: './form-shell.component.html',
  styleUrl: './form-shell.component.css',
})
export class FormShellComponent {
  @Input() title = '';
  @Input() helperText = '';
  @Input() maxWidth = 1120;
}
