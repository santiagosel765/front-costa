import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

interface ConfigTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-config-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, NzCardModule, NzTabsModule, NzBreadCrumbModule],
  templateUrl: './config-shell.component.html',
  styleUrls: ['./config-shell.component.css'],
})
export class ConfigShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  readonly tabs: ConfigTab[] = [
    { label: 'Monedas', path: '/main/config/currencies' },
    { label: 'Impuestos', path: '/main/config/taxes' },
    { label: 'Métodos de pago', path: '/main/config/payment-methods' },
    { label: 'Tipos de documento', path: '/main/config/document-types' },
    { label: 'Parámetros', path: '/main/config/parameters' },
  ];

  selectedIndex = 0;
  private navSub?: Subscription;

  get currentTabLabel(): string {
    return this.tabs[this.selectedIndex]?.label ?? 'Monedas';
  }

  ngOnInit(): void {
    this.syncSelectedTab(this.router.url);

    this.navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncSelectedTab(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  onTabChange(index: number): void {
    this.selectedIndex = index;
    const selectedTab = this.tabs[index] ?? this.tabs[0];
    this.router.navigateByUrl(selectedTab.path);
  }

  private syncSelectedTab(url: string): void {
    const index = this.tabs.findIndex((tab) => url.startsWith(tab.path));
    this.selectedIndex = index >= 0 ? index : 0;
  }
}
