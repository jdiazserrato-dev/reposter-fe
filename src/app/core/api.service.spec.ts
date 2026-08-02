import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('get calls /api/path', () => {
    service.get<{ ok: boolean }>('/things').subscribe((v) => expect(v.ok).toBe(true));
    const req = http.expectOne('/api/things');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('post sends body to /api/path', () => {
    service.post<{ id: number }>('/things', { a: 1 }).subscribe();
    const req = http.expectOne('/api/things');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ a: 1 });
    req.flush({ id: 1 });
  });

  it('patch sends body to /api/path/:id', () => {
    service.patch<{ id: number }>('/things/1', { a: 2 }).subscribe();
    const req = http.expectOne('/api/things/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1 });
  });

  it('delete calls /api/path/:id', () => {
    service.delete<void>('/things/1').subscribe();
    const req = http.expectOne('/api/things/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('upload sends FormData with file and kind', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service
      .upload('/uploads', file, 'recipes')
      .subscribe((r) => expect(r.url).toBe('/uploads/recipes/a.png'));
    const req = http.expectOne('/api/uploads');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('kind')).toBe('recipes');
    expect(body.get('file')).toBe(file);
    req.flush({ url: '/uploads/recipes/a.png' });
  });
});
