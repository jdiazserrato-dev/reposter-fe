import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipesService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(RecipesService);
  });

  it('findAll calls GET /recipes', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/recipes');
  });

  it('findOne calls GET /recipes/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/recipes/1');
  });

  it('create calls POST /recipes', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service.create({ name: 'Torta' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/recipes', { name: 'Torta' });
  });

  it('update calls PATCH /recipes/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.update(1, { name: 'Bizcocho' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/recipes/1', { name: 'Bizcocho' });
  });

  it('remove calls DELETE /recipes/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/recipes/1');
  });
});
