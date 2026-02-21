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
import { Subject, map, takeUntil } from 'rxjs';

import {
  MODULE_ICON_MAP,
  MODULE_LABEL_MAP,
  MODULE_ROUTE_MAP,
  normalizeModuleName,
} from '../../core/constants/module-route-map';
import { ModuleDTO } from '../../core/services/modules.service';
import { ModulesStore } from '../../core/state/modules.store';

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

  private readonly modulesStore = inject(ModulesStore);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  loading = false;
  menuItems: SidebarMenuItem[] = [];

  ngOnInit(): void {
    this.loading = true;

    this.modulesStore
      // Se consume el store centralizado de módulos habilitados para alinear menú y guards.
      .loadOnce()
      .pipe(
        map(() => this.modulesStore.getEnabledModules()),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (enabledModules) => {
          this.menuItems = enabledModules
            .map((module) => this.buildMenuItem(module))
            .filter((item): item is SidebarMenuItem => !!item);

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

  private buildMenuItem(module: ModuleDTO): SidebarMenuItem | null {
    const key = normalizeModuleName(module.name) ?? module.name?.toUpperCase();

    if (!key) {
      return null;
    }

    const route = MODULE_ROUTE_MAP[key] ?? '/main/welcome';

    return {
      key,
      route,
      // Se prioriza el nombre del módulo para mostrar el label real definido en BD.
      label: MODULE_LABEL_MAP[key] ?? module.name ?? this.formatLabel(key),
      icon: MODULE_ICON_MAP[key] ?? 'appstore',
    };
  }

  private formatLabel(key: string): string {
    return key
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
