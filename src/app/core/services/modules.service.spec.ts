import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ModulesService, ModulesResponse } from './modules.service';
import { ApiService } from './api.service';

describe('ModulesService', () => {
  let service: ModulesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, ModulesService],
    });

    service = TestBed.inject(ModulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all modules across all pages', () => {
    const page0: ModulesResponse = {
      content: [
        { id: '1', name: 'INVENTORY', description: 'Inventory module', status: 1 },
      ],
      page: 0,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    const page1: ModulesResponse = {
      content: [
        { id: '2', name: 'CLIENTS', description: 'Clients module', status: 1 },
      ],
      page: 1,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };

    const collected: string[] = [];

    service.getAllModules(1).subscribe((modules) => {
      collected.push(...modules.map((module) => module.id));
      expect(modules.length).toBe(2);
      expect(modules[0].id).toBe('1');
      expect(modules[1].id).toBe('2');
    });

    const request0 = httpMock.expectOne((req) => {
      return (
        req.url === `${environment.apiBaseUrl}/v1/auth/modules` &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '1'
      );
    });
    expect(request0.request.method).toBe('GET');
    request0.flush(page0);

    const request1 = httpMock.expectOne((req) => {
      return (
        req.url === `${environment.apiBaseUrl}/v1/auth/modules` &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '1'
      );
    });
    expect(request1.request.method).toBe('GET');
    request1.flush(page1);

    expect(collected).toEqual(['1', '2']);
  });

  it('should reuse cached modules on subsequent calls', () => {
    const response: ModulesResponse = {
      content: [
        { id: '1', name: 'INVENTORY', description: 'Inventory module', status: 1 },
      ],
      page: 0,
      size: 200,
      totalElements: 1,
      totalPages: 1,
    };

    const firstSubscription: string[] = [];
    const secondSubscription: string[] = [];

    service.getAllModules().subscribe((modules) => firstSubscription.push(...modules.map((m) => m.id)));

    const request = httpMock.expectOne((req) => req.url === `${environment.apiBaseUrl}/v1/auth/modules`);
    request.flush(response);

    service.getAllModules().subscribe((modules) => secondSubscription.push(...modules.map((m) => m.id)));

    httpMock.expectNone((req) => req.url === `${environment.apiBaseUrl}/v1/auth/modules`);

    expect(firstSubscription).toEqual(['1']);
    expect(secondSubscription).toEqual(['1']);
  });
});
