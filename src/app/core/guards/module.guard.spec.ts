import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ModulesStore } from '../state/modules.store';
import { ModuleGuard } from './module.guard';

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let modulesStore: jasmine.SpyObj<ModulesStore>;
  let router: Router;

  beforeEach(() => {
    const modulesStoreSpy = jasmine.createSpyObj<ModulesStore>('ModulesStore', [
      'loadOnce',
      'hasEnabledModule',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [ModuleGuard, { provide: ModulesStore, useValue: modulesStoreSpy }],
    });

    guard = TestBed.inject(ModuleGuard);
    modulesStore = TestBed.inject(ModulesStore) as jasmine.SpyObj<ModulesStore>;
    router = TestBed.inject(Router);
  });

  const createRoute = (moduleKey?: string): ActivatedRouteSnapshot =>
    ({
      data: moduleKey ? { moduleKey } : {},
    }) as ActivatedRouteSnapshot;

  it('should allow activation when module is available', (done) => {
    modulesStore.loadOnce.and.returnValue(of([]));
    modulesStore.hasEnabledModule.and.returnValue(true);

    guard.canActivate(createRoute('CLIENT')).subscribe((result) => {
      expect(result).toBeTrue();
      expect(modulesStore.loadOnce).toHaveBeenCalled();
      expect(modulesStore.hasEnabledModule).toHaveBeenCalledWith('CLIENT');
      done();
    });
  });

  it('should redirect when module is not available', (done) => {
    modulesStore.loadOnce.and.returnValue(of([]));
    modulesStore.hasEnabledModule.and.returnValue(false);

    guard.canActivate(createRoute('QUOTE')).subscribe((result) => {
      const expectedUrl: UrlTree = router.parseUrl('/main/welcome');
      expect(result).toEqual(expectedUrl);
      done();
    });
  });

  it('should pass through when no module is defined', (done) => {
    guard.canActivate(createRoute()).subscribe((result) => {
      expect(result).toBeTrue();
      expect(modulesStore.loadOnce).not.toHaveBeenCalled();
      expect(modulesStore.hasEnabledModule).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect on error', (done) => {
    modulesStore.loadOnce.and.returnValue(throwError(() => new Error('Network error')));

    guard.canActivate(createRoute('INVENTORY')).subscribe((result) => {
      const expectedUrl: UrlTree = router.parseUrl('/main/welcome');
      expect(result).toEqual(expectedUrl);
      done();
    });
  });
});
