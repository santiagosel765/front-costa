import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

import { SessionStore } from '../../core/state/session.store';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly sessionStore = inject(SessionStore);

  private moduleKey = '';
  private permission = 'read';

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

  private render(): void {
    this.vcr.clear();
    if (!this.moduleKey) {
      return;
    }

    if (this.sessionStore.hasPermission(this.moduleKey, this.permission) || (this.permission === 'write' && this.sessionStore.canWrite(this.moduleKey))) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
