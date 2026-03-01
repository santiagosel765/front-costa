import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-org-legacy-redirect',
  standalone: true,
  template: '',
})
export class OrgLegacyRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const tab = (this.route.snapshot.data['tab'] as string | undefined) ?? 'branches';
    this.router.navigate(['/main/org'], { queryParams: { tab } });
  }
}
