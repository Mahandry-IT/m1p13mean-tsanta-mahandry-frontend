import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { ResourceListService } from './resource-list.service';

describe('ResourceListService', () => {
  let service: ResourceListService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, ResourceListService],
    });

    service = TestBed.inject(ResourceListService);
    http = TestBed.inject(HttpTestingController);
  });

  it('construit les params page/limit/q/status', () => {
    service
      .fetchPage<any>({ endpoint: '/users', page: 2, limit: 10, q: 'john', filters: { status: 'active' }, itemsKey: 'users' })
      .subscribe();

    const req = http.expectOne(`${environment.apiUrl}/users?page=2&limit=10&status=active&q=john`);
    expect(req.request.method).toBe('GET');

    req.flush({
      success: true,
      message: 'ok',
      data: {
        users: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 10,
          totalPages: 0,
          hasPrev: true,
          hasNext: false,
        },
      },
    });

    http.verify();
  });
});

