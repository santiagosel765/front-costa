import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-provider-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  templateUrl: './provider-shell.component.html',
  styleUrls: ['./provider-shell.component.css'],
})
export class ProviderShellComponent {}
