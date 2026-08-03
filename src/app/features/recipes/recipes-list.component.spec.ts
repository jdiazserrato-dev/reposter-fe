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
      .querySelectorAll<HTMLButtonElement>('button.btn-danger')[0]
      .click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });

  it('opens the modal when "Ver" is clicked', () => {
    service.findAll.mockReturnValue(
      of([{ id: 1, name: 'Torta', servings: 8, prepTime: 60, items: [] }]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();

    const viewBtn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[0];
    viewBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Torta');
    expect(fixture.nativeElement.querySelector('.fixed')).not.toBeNull();
  });

  it('closes the modal when the backdrop is clicked', () => {
    service.findAll.mockReturnValue(
      of([{ id: 1, name: 'Torta', items: [] }]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();

    const viewBtn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[0];
    viewBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fixed')).not.toBeNull();

    const backdrop = fixture.nativeElement.querySelector('.fixed');
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });

  it('renders full recipe details in the modal (photo, ingredients, procedure, notes)', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 1,
          name: 'Torta',
          servings: 8,
          prepTime: 60,
          photoPath: '/uploads/recipes/cake.jpg',
          items: [{ ingredientName: 'Harina', quantity: 500, unit: 'g' }],
          procedure: ['Mezclar', 'Hornear'],
          notes: 'Dejar enfriar',
        },
      ]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();

    const viewBtn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[0];
    viewBtn.click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Harina');
    expect(el.textContent).toContain('Mezclar');
    expect(el.textContent).toContain('Hornear');
    expect(el.textContent).toContain('Dejar enfriar');
    expect(el.querySelector('img[src="/uploads/recipes/cake.jpg"]')).not.toBeNull();
  });

  it('keeps modal open when clicking inside the modal content', () => {
    service.findAll.mockReturnValue(
      of([{ id: 1, name: 'Torta', items: [] }]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();

    const viewBtn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[0];
    viewBtn.click();
    fixture.detectChanges();

    const modalContent = fixture.nativeElement.querySelector('.sign-panel');
    modalContent.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fixed')).not.toBeNull();
  });

  it('closes the modal via Escape key', () => {
    service.findAll.mockReturnValue(
      of([{ id: 1, name: 'Torta', items: [] }]),
    );
    const fixture = TestBed.createComponent(RecipesListComponent);
    fixture.detectChanges();

    const viewBtn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[0];
    viewBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fixed')).not.toBeNull();

    const backdrop = fixture.nativeElement.querySelector('.fixed') as HTMLElement;
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });
});
