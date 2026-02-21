import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { UsersListComponent } from './users/users-list.component';
import { RolesListComponent } from './roles/roles-list.component';
import { ModulesListComponent } from './modules/modules-list.component';
import { PermissionsMatrixComponent } from './permissions/permissions-matrix.component';

@Component({
  selector: 'app-auth-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzTabsModule,
    NzButtonModule,
    NzIconModule,
    UsersListComponent,
    RolesListComponent,
    ModulesListComponent,
    PermissionsMatrixComponent,
  ],
  templateUrl: './auth-admin-panel.component.html',
  styleUrls: ['./auth-admin-panel.component.css'],
})
export class AuthAdminPanelComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tabKeys = ['users', 'roles', 'modules', 'permissions'];
  activeTabIndex = 0;
  private querySub?: Subscription;

  ngOnInit(): void {
    this.syncTabFromRoute();
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const tab = this.tabKeys[index] ?? 'users';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  private syncTabFromRoute(): void {
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const tabFromQuery = params.get('tab');
      const tabFromData = this.route.snapshot.routeConfig?.data?.['tab'];
      const selectedKey = tabFromQuery || tabFromData;
      const idx = selectedKey ? this.tabKeys.indexOf(selectedKey) : -1;
      this.activeTabIndex = idx >= 0 ? idx : 0;
    });
  }
}
