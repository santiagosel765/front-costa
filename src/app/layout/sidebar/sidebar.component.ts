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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, takeUntil } from 'rxjs';

import { normalizeModuleName, resolveModulePresentation } from '../../core/constants/module-route-map';
import { AuthContextModule } from '../../core/models/auth-context.models';
import { SessionStore } from '../../core/state/session.store';

interface SidebarMenuItem {
  key: string;
  route: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, NzMenuModule, NzMessageModule, NzSpinModule],
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
          const uniqueMenuItems = new Map<string, SidebarMenuItem>();

          modules.forEach((module) => {
            const item = this.buildMenuItem(module);
            const uniqueKey = this.resolveUniqueKey(module, item);
            if (!uniqueMenuItems.has(uniqueKey)) {
              uniqueMenuItems.set(uniqueKey, item);
            }
          });

          this.menuItems = Array.from(uniqueMenuItems.values());
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


  private resolveUniqueKey(module: AuthContextModule, item: SidebarMenuItem): string {
    const normalizedKey = normalizeModuleName(module.key);
    if (normalizedKey) {
      return normalizedKey;
    }

    return item.key?.toUpperCase?.() || module.key || item.route;
  }

  private buildMenuItem(module: AuthContextModule): SidebarMenuItem {
    const key = normalizeModuleName(module.key) ?? module.key;
    const metadata = resolveModulePresentation(module);

    return {
      key,
      route: metadata.route,
      label: metadata.label,
      icon: metadata.icon,
    };
  }
}
