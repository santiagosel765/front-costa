import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';

import { ApiResponse, unwrapApiResponse } from '../models/api.models';
import { ApiService } from './api.service';

export interface UserBranch {
  id: string;
  code?: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private static readonly ACTIVE_BRANCH_KEY = 'activeBranchId';

  private readonly api = inject(ApiService);

  private readonly branchesSubject = new BehaviorSubject<UserBranch[]>([]);
  readonly branches$ = this.branchesSubject.asObservable();

  private readonly activeBranchSubject = new BehaviorSubject<UserBranch | null>(null);
  readonly activeBranch$ = this.activeBranchSubject.asObservable();

  loadAllowedBranches(): Observable<UserBranch[]> {
    return this.api
      .get<ApiResponse<UserBranch[] | { data?: UserBranch[] }> | UserBranch[] | { data?: UserBranch[] }>('/v1/org/me/branches')
      .pipe(
        map((response) => {
          const unwrapped = unwrapApiResponse<UserBranch[] | { data?: UserBranch[] }>(response) ?? [];
          if (Array.isArray(unwrapped)) {
            return unwrapped;
          }

          return Array.isArray(unwrapped.data) ? unwrapped.data : [];
        }),
        map((branches) => branches.map((branch) => ({ ...branch, name: branch.name ?? branch.code ?? branch.id }))),
        tap((branches) => {
          this.branchesSubject.next(branches);
          this.restoreActiveBranch(branches);
        }),
      );
  }

  getActiveBranchId(): string | null {
    return this.activeBranchSubject.value?.id ?? localStorage.getItem(BranchContextService.ACTIVE_BRANCH_KEY);
  }

  setActiveBranch(branch: UserBranch): Observable<UserBranch> {
    return this.validateBranch(branch.id).pipe(
      map(() => branch),
      tap((validatedBranch) => {
        localStorage.setItem(BranchContextService.ACTIVE_BRANCH_KEY, validatedBranch.id);
        this.activeBranchSubject.next(validatedBranch);
      }),
    );
  }

  clearActiveBranch(): void {
    localStorage.removeItem(BranchContextService.ACTIVE_BRANCH_KEY);
    this.activeBranchSubject.next(null);
  }

  validateBranch(branchId: string): Observable<void> {
    return this.api
      .get<ApiResponse<unknown> | unknown>(`/v1/org/me/branches/${branchId}/validate`)
      .pipe(map(() => void 0));
  }

  private restoreActiveBranch(branches: UserBranch[]): void {
    const storedBranchId = localStorage.getItem(BranchContextService.ACTIVE_BRANCH_KEY);
    if (!storedBranchId) {
      this.activeBranchSubject.next(null);
      return;
    }

    const storedBranch = branches.find((branch) => branch.id === storedBranchId);
    if (!storedBranch) {
      this.clearActiveBranch();
      return;
    }

    this.activeBranchSubject.next(storedBranch);
  }
}
