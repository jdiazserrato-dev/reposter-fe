import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(OrdersService);
  });

  it('findAll calls GET /orders', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/orders');
  });

  it('findOne calls GET /orders/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/orders/1');
  });

  it('create calls POST /orders', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service.create({ clientId: 1 }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/orders', { clientId: 1 });
  });

  it('update calls PATCH /orders/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.update(1, { status: 'IN_PRODUCTION' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/orders/1', { status: 'IN_PRODUCTION' });
  });

  it('updateStatus calls PATCH /orders/:id/status', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.updateStatus(1, 'READY_FOR_DELIVERY').subscribe();
    expect(api.patch).toHaveBeenCalledWith('/orders/1/status', { status: 'READY_FOR_DELIVERY' });
  });

  it('remove calls DELETE /orders/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/orders/1');
  });
});
