import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { RecipesListComponent } from './recipes-list.component';
import { RecipesService } from './recipes.service';

describe('RecipesListComponent', () => {
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = { findAll: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RecipesListComponent],
      providers: [
        { provide: RecipesService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
  });

  it('renders the recipe list', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 1,
          name: 'Torta',
          servings: 8,
          prepTime: 60,
          items: [],
        },
        {
          id: 2,
          name: 'Bizcocho',
          servings: null,
          prepTime: null,
          items: [],
        },
      ]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Torta');
    expect(fixture.nativeElement.textContent).toContain('Bizcocho');
  });

  it('shows empty state', () => {
    service.findAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Sin recetas registradas.',
    );
  });

  it('removes a recipe and reloads', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Torta', items: [] }]));
    service.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.btn-danger')!
      .click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });
});
