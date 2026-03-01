import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

type InventoryTabKey = 'products' | 'categories' | 'brands' | 'uom' | 'attributes' | 'tax-profiles';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTabsModule, RouterOutlet],
  templateUrl: './inventory-shell.component.html',
  styleUrls: ['./inventory-shell.component.css'],
})
export class InventoryShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tabs: Array<{ key: InventoryTabKey; title: string }> = [
    { key: 'products', title: 'Productos' },
    { key: 'categories', title: 'Categorías' },
    { key: 'brands', title: 'Marcas' },
    { key: 'uom', title: 'UOM' },
    { key: 'attributes', title: 'Atributos' },
    { key: 'tax-profiles', title: 'Perfiles de impuestos' },
  ];

  activeTab: InventoryTabKey = 'products';
  private routeSub?: Subscription;

  get selectedIndex(): number {
    return this.tabs.findIndex((tab) => tab.key === this.activeTab);
  }

  ngOnInit(): void {
    this.syncTabFromRoute();
    this.routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncTabFromRoute());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onTabChange(index: number): void {
    const tab = this.tabs[index]?.key;
    if (!tab || tab === this.activeTab) {
      return;
    }

    this.router.navigate([tab], { relativeTo: this.route });
  }

  private syncTabFromRoute(): void {
    const childPath = this.route.firstChild?.snapshot.routeConfig?.path as InventoryTabKey | undefined;
    this.activeTab = this.tabs.some((tab) => tab.key === childPath) ? childPath! : 'products';
  }
}
