import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ModulesService } from '../services/modules.service';
import { ModuleGuard } from './module.guard';

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let modulesService: jasmine.SpyObj<ModulesService>;
  let router: Router;

  beforeEach(() => {
    const modulesServiceSpy = jasmine.createSpyObj<ModulesService>('ModulesService', ['getAllModules']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        ModuleGuard,
        { provide: ModulesService, useValue: modulesServiceSpy },
      ],
    });

    guard = TestBed.inject(ModuleGuard);
    modulesService = TestBed.inject(ModulesService) as jasmine.SpyObj<ModulesService>;
    router = TestBed.inject(Router);
  });

  const createRoute = (moduleKey?: string): ActivatedRouteSnapshot => ({
    data: moduleKey ? { moduleKey } : {},
  }) as ActivatedRouteSnapshot;

  it('should allow activation when module is available', (done) => {
    modulesService.getAllModules.and.returnValue(
      of([
        { id: '1', name: 'INVENTORY', description: '', status: 1 },
        { id: '2', name: 'CLIENTS', description: '', status: 1 },
      ]),
    );

    guard.canActivate(createRoute('CLIENT')).subscribe((result) => {
      expect(result).toBeTrue();
      expect(modulesService.getAllModules).toHaveBeenCalled();
      done();
    });
  });

  it('should redirect when module is not available', (done) => {
    modulesService.getAllModules.and.returnValue(
      of([{ id: '1', name: 'INVENTORY', description: '', status: 1 }]),
    );

    guard.canActivate(createRoute('QUOTE')).subscribe((result) => {
      const expectedUrl: UrlTree = router.parseUrl('/main/welcome');
      expect(result).toEqual(expectedUrl);
      done();
    });
  });

  it('should pass through when no module is defined', (done) => {
    guard.canActivate(createRoute()).subscribe((result) => {
      expect(result).toBeTrue();
      expect(modulesService.getAllModules).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect on error', (done) => {
    modulesService.getAllModules.and.returnValue(throwError(() => new Error('Network error')));

    guard.canActivate(createRoute('INVENTORY')).subscribe((result) => {
      const expectedUrl: UrlTree = router.parseUrl('/main/welcome');
      expect(result).toEqual(expectedUrl);
      done();
    });
  });
});
