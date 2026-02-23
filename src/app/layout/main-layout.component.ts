// src/app/layouts/main-layout/main-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import { AuthContextService } from '../core/services/auth-context.service';
import { SessionStore } from '../core/state/session.store';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NzIconModule, NzLayoutModule, SidebarComponent],
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
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
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
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  private readonly authContextService = inject(AuthContextService);
  private readonly sessionStore = inject(SessionStore);

  isCollapsed = false;

  ngOnInit(): void {
    if (!this.sessionStore.getToken() || this.sessionStore.hasContextLoaded()) {
      return;
    }

    this.authContextService.loadContext().subscribe();
  }
}
