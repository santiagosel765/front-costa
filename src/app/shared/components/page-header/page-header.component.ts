import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface HeaderBreadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NzBreadCrumbModule, NzButtonModule, NzIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  @Input() breadcrumbs: HeaderBreadcrumb[] = [];
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() backLink?: string;
  @Input() backLabel = 'Volver';
}
