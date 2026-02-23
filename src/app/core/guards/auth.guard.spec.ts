import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuthContextService } from '../services/auth-context.service';
import { SessionStore } from '../state/session.store';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let sessionStore: jasmine.SpyObj<SessionStore>;
  let authContextService: jasmine.SpyObj<AuthContextService>;
  let router: Router;

  beforeEach(() => {
    const sessionSpy = jasmine.createSpyObj<SessionStore>('SessionStore', [
      'isTokenExpired',
      'hasContextLoaded',
      'clearSession',
    ]);
    const contextSpy = jasmine.createSpyObj<AuthContextService>('AuthContextService', ['loadContext']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        AuthGuard,
        { provide: SessionStore, useValue: sessionSpy },
        { provide: AuthContextService, useValue: contextSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    sessionStore = TestBed.inject(SessionStore) as jasmine.SpyObj<SessionStore>;
    authContextService = TestBed.inject(AuthContextService) as jasmine.SpyObj<AuthContextService>;
    router = TestBed.inject(Router);
  });

  it('redirects to login when token is expired', (done) => {
    sessionStore.isTokenExpired.and.returnValue(true);

    guard.canActivate().subscribe((result) => {
      expect(result).toEqual(router.parseUrl('/auth/login'));
      expect(sessionStore.clearSession).toHaveBeenCalledWith(false);
      done();
    });
  });

  it('allows navigation when context is already loaded', (done) => {
    sessionStore.isTokenExpired.and.returnValue(false);
    sessionStore.hasContextLoaded.and.returnValue(true);

    guard.canActivate().subscribe((result) => {
      expect(result).toBeTrue();
      expect(authContextService.loadContext).not.toHaveBeenCalled();
      done();
    });
  });

  it('loads context on demand', (done) => {
    sessionStore.isTokenExpired.and.returnValue(false);
    sessionStore.hasContextLoaded.and.returnValue(false);
    authContextService.loadContext.and.returnValue(of({} as any));

    guard.canActivate().subscribe((result) => {
      expect(result).toBeTrue();
      expect(authContextService.loadContext).toHaveBeenCalled();
      done();
    });
  });

  it('redirects if context request fails', (done) => {
    sessionStore.isTokenExpired.and.returnValue(false);
    sessionStore.hasContextLoaded.and.returnValue(false);
    authContextService.loadContext.and.returnValue(throwError(() => new Error('fail')));

    guard.canActivate().subscribe((result) => {
      expect(result).toEqual(router.parseUrl('/auth/login'));
      expect(sessionStore.clearSession).toHaveBeenCalledWith(false);
      done();
    });
  });
});
