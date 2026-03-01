import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { OrgAssignmentsComponent } from '../assignments/org-assignments.component';
import { OrgBranchesComponent } from '../branches/org-branches.component';
import { OrgNumberingComponent } from '../numbering/org-numbering.component';
import { OrgWarehousesComponent } from '../warehouses/org-warehouses.component';

type OrgTabKey = 'branches' | 'assignments' | 'warehouses' | 'numbering';

@Component({
  selector: 'app-org-hub',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTabsModule, OrgBranchesComponent, OrgAssignmentsComponent, OrgWarehousesComponent, OrgNumberingComponent],
  templateUrl: './org-hub.component.html',
  styleUrl: './org-hub.component.css',
})
export class OrgHubComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tabs: Array<{ key: OrgTabKey; label: string }> = [
    { key: 'branches', label: 'Sucursales' },
    { key: 'assignments', label: 'Asignaciones' },
    { key: 'warehouses', label: 'Bodegas' },
    { key: 'numbering', label: 'Numeración' },
  ];

  activeTab: OrgTabKey = 'branches';
  private querySub?: Subscription;

  get selectedIndex(): number {
    return this.tabs.findIndex((item) => item.key === this.activeTab);
  }

  ngOnInit(): void {
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as OrgTabKey | null;
      this.activeTab = this.tabs.some((item) => item.key === tab) ? (tab as OrgTabKey) : 'branches';
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  onTabChange(index: number): void {
    const selected = this.tabs[index]?.key ?? 'branches';
    this.activeTab = selected;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: selected },
      queryParamsHandling: 'merge',
    });
  }
}
