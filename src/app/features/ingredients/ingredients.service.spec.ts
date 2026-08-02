import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { IngredientsService } from './ingredients.service';

describe('IngredientsService', () => {
  let service: IngredientsService;
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IngredientsService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(IngredientsService);
  });

  it('findAll calls GET /ingredients', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/ingredients');
  });

  it('findOne calls GET /ingredients/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/ingredients/1');
  });

  it('create calls POST /ingredients', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service.create({ name: 'Harina' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/ingredients', { name: 'Harina' });
  });

  it('update calls PATCH /ingredients/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.update(1, { name: 'Azúcar' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/ingredients/1', {
      name: 'Azúcar',
    });
  });

  it('remove calls DELETE /ingredients/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/ingredients/1');
  });
});
