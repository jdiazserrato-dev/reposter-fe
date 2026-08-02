import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientsService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(ClientsService);
  });

  it('findAll calls GET /clients', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/clients');
  });

  it('findOne calls GET /clients/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/clients/1');
  });

  it('create calls POST /clients', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service.create({ name: 'Ana' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/clients', { name: 'Ana' });
  });

  it('update calls PATCH /clients/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.update(1, { name: 'Betty' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/clients/1', { name: 'Betty' });
  });

  it('remove calls DELETE /clients/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/clients/1');
  });
});
