import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { SessionStore } from '../../core/state/session.store';
import { ModulesListComponent } from './modules/modules-list.component';
import { PermissionsMatrixComponent } from './permissions/permissions-matrix.component';
import { RolesListComponent } from './roles/roles-list.component';
import { UsersListComponent } from './users/users-list.component';

@Component({
  selector: 'app-auth-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzTabsModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
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
  private readonly sessionStore = inject(SessionStore);

  readonly authModuleKey = 'CORE_DE_AUTENTICACION';
  readonly tabKeys = ['users', 'roles', 'modules', 'permissions'];

  activeTabIndex = 0;
  canRead = this.sessionStore.canRead(this.authModuleKey);
  canWrite = this.sessionStore.canWrite(this.authModuleKey);
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

      if (!this.canWrite && this.activeTabIndex > 0) {
        this.activeTabIndex = 0;
      }
    });
  }
}
