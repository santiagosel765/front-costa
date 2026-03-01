import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  isDevMode,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
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
  route: string | null;
  label: string;
  icon: string;
  disabled: boolean;
  disabledReason?: string | null;
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
          if (isDevMode()) {
            console.debug('[sidebar] modules from session', modules.map((module) => module.moduleKey));
          }

          const keyOf = (module: AuthContextModule): string =>
            normalizeModuleName(module.moduleKey ?? module.key) ?? 'UNKNOWN';

          if (isDevMode()) {
            console.debug(
              '[sidebar] normalized module keys',
              modules.map((module) => ({ raw: module.moduleKey ?? module.key, normalized: keyOf(module) })),
            );
          }

          const uniqueModules = Array.from(new Map(modules.map((module) => [keyOf(module), module])).entries()).map(
            ([key, module]) => ({ ...module, moduleKey: key }),
          );

          this.menuItems = uniqueModules
            .map((module) => this.buildMenuItem(module))
            .sort((left, right) => left.label.localeCompare(right.label, 'es'));

          if (isDevMode()) {
            console.debug(
              '[sidebar] mapped routes',
              this.menuItems.map((item) => ({
                key: item.key,
                route: item.route,
                disabled: item.disabled,
                reason: item.disabledReason ?? 'enabled',
              })),
            );
          }

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

    const key = normalizeModuleName(module.moduleKey ?? module.key) ?? 'UNKNOWN';

    return {
      key,
      route: metadata.route,
      label: metadata.label,
      icon: metadata.icon,
      disabled: metadata.disabled,
      disabledReason: metadata.disabledReason,
    };
  }
}
