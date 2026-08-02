import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductsService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(ProductsService);
  });

  it('findAll calls GET /products', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/products');
  });

  it('findOne calls GET /products/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/products/1');
  });

  it('create calls POST /products', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service
      .create({ name: 'Torta', category: 'torta', basePrice: 20 })
      .subscribe();
    expect(api.post).toHaveBeenCalledWith('/products', {
      name: 'Torta',
      category: 'torta',
      basePrice: 20,
    });
  });

  it('update calls PATCH /products/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service
      .update(1, { name: 'Torta', category: 'torta', basePrice: 25 })
      .subscribe();
    expect(api.patch).toHaveBeenCalledWith('/products/1', {
      name: 'Torta',
      category: 'torta',
      basePrice: 25,
    });
  });

  it('remove calls DELETE /products/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/products/1');
  });
});
