// src/app/layouts/main-layout/main-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NzIconModule, NzLayoutModule, SidebarComponent],
  template: `
    <nz-layout class="app-layout">
  <nz-sider class="menu-sidebar"
    nzCollapsible
    nzWidth="256px"
    nzBreakpoint="md"
    [(nzCollapsed)]="isCollapsed"
    [nzTrigger]="null"
  >
    <div class="sidebar-logo">
      <div class="logo-content">
        <img src="assets/images/logoferre.png" alt="logo">
        <h1 [class.hidden]="isCollapsed">Qbit-SasS</h1>
      </div>
    </div>
    <app-sidebar [collapsed]="isCollapsed"></app-sidebar>
  </nz-sider>

  <nz-layout class="layout-container">
    <nz-header>
      <div class="app-header">
        <div class="header-left">
          <span class="header-trigger" (click)="isCollapsed = !isCollapsed">
            <nz-icon class="trigger" [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
          </span>
          
          <!-- Breadcrumb opcional -->
          <div class="breadcrumb-section">
            <span class="current-section"></span>
          </div>
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
  styles: [`
    :host {
  display: flex;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  height: 100vh;
}

.menu-sidebar {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  box-shadow: 2px 0 6px rgba(0,21,41,.35);
}

.header-trigger {
  height: 64px;
  padding: 20px 24px;
  font-size: 20px;
  cursor: pointer;
  transition: all .3s,padding 0s;
}

.ant-menu-dark.ant-menu-dark:not(.ant-menu-horizontal) .ant-menu-item-selected {

}

.trigger:hover {
  color: #004cff;
}

.sidebar-logo {
  position: relative;
  height: 64px;
  padding-left: 24px;
  overflow: hidden;
  line-height: 64px;
  background: #031425;
  transition: all .3s;
}

.ant-menu.ant-menu-dark{
  color: #fff !important;
}

.sidebar-logo img {
  display: inline-block;
  height: 32px;
  width: 32px;
  vertical-align: middle;
}

.ant-menu-title-content {
    transition: color .0s !important;
}

.ant-menu-dark .ant-menu-item:hover,li.ant-menu-item.ant-menu-item-selected{
  background-color: #0077f7 !important;
}

.container-logout.ant-menu-item, .container-logout.ant-menu-item a{
  color: #fff !important;
}

.layout-container{
  overflow: overlay;
}

.btn-logout{
  background-color: #fff;
}
.btn-logout:hover{
  background-color: #fff !important;
  font-weight: 600;
}

.sidebar-logo h1 {
  display: inline-block;
  margin: 0 0 0 20px;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  font-family: Avenir,Helvetica Neue,Arial,Helvetica,sans-serif;
  vertical-align: middle;
}

nz-header {
  padding: 0;
  width: 100%;
  z-index: 2;
}

.app-header {
  position: relative;
  height: 64px;
  padding: 0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

nz-content {
  margin: 24px;
}

.inner-content {
  background: #fff;
  height: 100%;
}

  `],

})
export class MainLayoutComponent {
  isCollapsed = false;
}