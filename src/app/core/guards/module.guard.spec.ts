import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Route, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { SessionStore } from '../state/session.store';
import { ModuleGuard } from './module.guard';

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let sessionStore: jasmine.SpyObj<SessionStore>;
  let router: Router;

  beforeEach(() => {
    const sessionStoreSpy = jasmine.createSpyObj<SessionStore>('SessionStore', ['hasEnabledModule']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [ModuleGuard, { provide: SessionStore, useValue: sessionStoreSpy }],
    });

    guard = TestBed.inject(ModuleGuard);
    sessionStore = TestBed.inject(SessionStore) as jasmine.SpyObj<SessionStore>;
    router = TestBed.inject(Router);
  });

  const createRoute = (moduleKey?: string): ActivatedRouteSnapshot =>
    ({
      data: moduleKey ? { moduleKey } : {},
    }) as ActivatedRouteSnapshot;

  it('should allow activation when module is available', (done) => {
    sessionStore.hasEnabledModule.and.returnValue(true);

    guard.canActivate(createRoute('CLIENT')).subscribe((result) => {
      expect(result).toBeTrue();
      expect(sessionStore.hasEnabledModule).toHaveBeenCalledWith('CLIENT');
      done();
    });
  });

  it('should redirect when module is not available', (done) => {
    sessionStore.hasEnabledModule.and.returnValue(false);

    guard.canActivate(createRoute('QUOTE')).subscribe((result) => {
      const expectedUrl: UrlTree = router.parseUrl('/main/welcome');
      expect(result).toEqual(expectedUrl);
      done();
    });
  });

  it('should pass through when no module is defined', (done) => {
    guard.canActivate(createRoute()).subscribe((result) => {
      expect(result).toBeTrue();
      expect(sessionStore.hasEnabledModule).not.toHaveBeenCalled();
      done();
    });
  });

  it('should validate canMatch using route data', (done) => {
    const route: Route = { path: 'inventory', data: { moduleKey: 'INVENTORY' } };
    sessionStore.hasEnabledModule.and.returnValue(true);

    guard.canMatch(route).subscribe((result) => {
      expect(result).toBeTrue();
      expect(sessionStore.hasEnabledModule).toHaveBeenCalledWith('INVENTORY');
      done();
    });
  });
});
