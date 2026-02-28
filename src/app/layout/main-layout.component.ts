// src/app/layouts/main-layout/main-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { AuthContextService } from '../core/services/auth-context.service';
import { BranchContextService, UserBranch } from '../core/services/branch-context.service';
import { SessionStore } from '../core/state/session.store';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, NzIconModule, NzLayoutModule, NzSelectModule, SidebarComponent],
  template: `
    <nz-layout class="app-layout">
      <nz-sider
        class="menu-sidebar"
        nzCollapsible
        nzWidth="256px"
        nzBreakpoint="md"
        [(nzCollapsed)]="isCollapsed"
        [nzTrigger]="null"
      >
        <div class="sidebar-logo">
          <div class="logo-content">
            <img src="assets/images/logoferre.png" alt="logo" />
            <h1 [class.hidden]="isCollapsed">Qbit-SasS</h1>
          </div>
        </div>
        <app-sidebar [collapsed]="isCollapsed"></app-sidebar>
      </nz-sider>

      <nz-layout class="layout-container">
        <nz-header>
          <div class="app-header">
            <span class="header-trigger" (click)="isCollapsed = !isCollapsed">
              <nz-icon class="trigger" [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
            </span>

            <div class="branch-selector">
              <span class="branch-label">Sucursal:</span>

              <ng-container *ngIf="branches.length; else noBranchesTpl">
                <nz-select
                  class="branch-dropdown"
                  nzPlaceHolder="Seleccionar sucursal"
                  [ngModel]="selectedBranchId"
                  (ngModelChange)="onBranchChange($event)"
                >
                  <nz-option *ngFor="let branch of branches" [nzValue]="branch.id" [nzLabel]="branch.name"></nz-option>
                </nz-select>
              </ng-container>

              <ng-template #noBranchesTpl>
                <span class="no-branches">Sin sucursales asignadas</span>
              </ng-template>
            </div>
          </div>
        </nz-header>

        <nz-content>
          <div class="inner-content">
            <router-outlet></router-outlet>
          </div>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [
    `
      :host {
        display: flex;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .app-layout {
        min-height: 100vh;
      }

      .menu-sidebar {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        box-shadow: 2px 0 10px rgba(0, 21, 41, 0.3);
      }

      .sidebar-logo {
        height: 64px;
        padding-inline: 20px;
        overflow: hidden;
        line-height: 64px;
        background: #031425;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .logo-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sidebar-logo img {
        height: 30px;
        width: 30px;
      }

      .sidebar-logo h1 {
        margin: 0;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
      }

      nz-header {
        padding: 0;
        width: 100%;
        z-index: 2;
        background: #fff;
      }

      .app-header {
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 20px;
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      }

      .branch-selector {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .branch-label {
        color: rgba(0, 0, 0, 0.72);
        font-size: 14px;
      }

      .branch-dropdown {
        width: 260px;
      }

      .no-branches {
        color: rgba(0, 0, 0, 0.55);
        font-size: 13px;
      }

      .header-trigger {
        padding: 0 20px;
        font-size: 20px;
        cursor: pointer;
      }

      .trigger:hover {
        color: #1677ff;
      }

      nz-content {
        margin: 12px;
      }

      .inner-content {
        max-width: 1280px;
        margin: 0 auto;
        width: 100%;
      }

      @media (max-width: 768px) {
        nz-content {
          margin: 8px;
        }

        .header-trigger {
          padding: 0 14px;
          font-size: 18px;
        }

        .app-header {
          padding-right: 12px;
        }

        .branch-dropdown {
          width: 180px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  private readonly authContextService = inject(AuthContextService);
  private readonly sessionStore = inject(SessionStore);
  private readonly branchContextService = inject(BranchContextService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  isCollapsed = false;
  branches: UserBranch[] = [];
  selectedBranchId: string | null = null;

  ngOnInit(): void {
    if (!this.sessionStore.getToken() || this.sessionStore.hasContextLoaded()) {
      this.initializeBranchContext();
      return;
    }

    this.authContextService
      .loadContext()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ complete: () => this.initializeBranchContext() });
  }

  onBranchChange(branchId: string): void {
    const selectedBranch = this.branches.find((branch) => branch.id === branchId);
    if (!selectedBranch) {
      this.message.error('Sucursal inválida');
      return;
    }

    this.branchContextService
      .setActiveBranch(selectedBranch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (branch) => {
          this.selectedBranchId = branch.id;
          this.message.success(`Sucursal activa: ${branch.name}`);
        },
        error: (error: { status?: number }) => {
          this.selectedBranchId = this.branchContextService.getActiveBranchId();
          if (error.status === 403 || error.status === 404) {
            this.message.error('No tienes permisos para usar esta sucursal');
            return;
          }

          this.message.error('No se pudo validar la sucursal seleccionada');
        },
      });
  }

  private initializeBranchContext(): void {
    this.branchContextService
      .loadAllowedBranches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (branches) => {
          this.branches = branches;
          this.selectedBranchId = this.branchContextService.getActiveBranchId();
        },
        error: () => {
          this.branches = [];
          this.selectedBranchId = null;
          this.message.error('No se pudieron cargar las sucursales del usuario');
        },
      });
  }
}
