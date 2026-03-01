import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, takeUntil } from 'rxjs';

import { resolveModulePresentation } from '../../core/constants/module-route-map';
import { AuthContextModule } from '../../core/models/auth-context.models';
import { SessionStore } from '../../core/state/session.store';

interface SidebarMenuItem {
  key: string;
  route: string | null;
  label: string;
  icon: string;
  disabled: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, NzMenuModule, NzMessageModule, NzSpinModule, NzToolTipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;

  private readonly sessionStore = inject(SessionStore);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  loading = false;
  menuItems: SidebarMenuItem[] = [];

  ngOnInit(): void {
    this.loading = true;

    this.sessionStore.modules$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modules) => {
          const uniqueModules = Array.from(new Map(modules.map((module) => [module.moduleKey, module])).values());

          this.menuItems = uniqueModules
            .map((module) => this.buildMenuItem(module))
            .sort((left, right) => left.label.localeCompare(right.label, 'es'));

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.menuItems = [];
          this.cdr.markForCheck();
          this.message.error('No se pudieron cargar módulos');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByKey = (_: number, item: SidebarMenuItem): string => item.key;

  logout(event: Event): void {
    event.preventDefault();
    this.sessionStore.clearSession();
  }

  private buildMenuItem(module: AuthContextModule): SidebarMenuItem {
    const metadata = resolveModulePresentation(module);

    return {
      key: module.moduleKey,
      route: metadata.route,
      label: metadata.label,
      icon: metadata.icon,
      disabled: metadata.disabled,
    };
  }
}
