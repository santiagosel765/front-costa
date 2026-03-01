import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { SessionStore } from '../../core/state/session.store';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly sessionStore = inject(SessionStore);

  private moduleKey = '';
  private permission = 'read';
  private readonly permissionsSub: Subscription;

  constructor() {
    this.permissionsSub = this.sessionStore.permissions$.subscribe(() => {
      this.render();
    });
  }

  @Input()
  set appHasPermission(value: string | [string, string]) {
    if (Array.isArray(value)) {
      this.moduleKey = value[0] ?? '';
      this.permission = value[1] ?? 'read';
    } else {
      this.moduleKey = value;
      this.permission = 'read';
    }
    this.render();
  }

  ngOnDestroy(): void {
    this.permissionsSub.unsubscribe();
  }

  private render(): void {
    this.vcr.clear();
    if (!this.moduleKey) {
      return;
    }

    if (this.sessionStore.hasPermission(this.moduleKey, this.permission)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
