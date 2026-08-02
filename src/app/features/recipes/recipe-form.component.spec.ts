import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeFormComponent } from './recipe-form.component';
import { RecipesService } from './recipes.service';

describe('RecipeFormComponent', () => {
  let service: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let ingredients: { findAll: ReturnType<typeof vi.fn> };
  let param: string | null = null;
  const route = { snapshot: { paramMap: { get: () => param } } };
  const router = { navigate: vi.fn() };
  const api = { upload: vi.fn() };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    ingredients = { findAll: vi.fn() };
    ingredients.findAll.mockReturnValue(of([]));
    param = null;
    TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
      providers: [
        { provide: RecipesService, useValue: service },
        { provide: IngredientsService, useValue: ingredients },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('loads ingredients on init', () => {
    ingredients.findAll.mockReturnValue(of([{ id: 1, name: 'Harina' }]));
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.ingredients()).toEqual([
      { id: 1, name: 'Harina' },
    ]);
  });

  it('adds and removes item lines', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.addItem();
    expect(fixture.componentInstance.items.length).toBe(1);
    fixture.componentInstance.removeItem(0);
    expect(fixture.componentInstance.items.length).toBe(0);
  });

  it('toggleIngredient adds a line when checked and removes when unchecked', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.toggleIngredient(
      { target: { checked: true } } as unknown as Event,
      { id: 1, name: 'Harina' },
    );
    expect(fixture.componentInstance.items.at(0).get('ingredientName')!.value).toBe(
      'Harina',
    );
    fixture.componentInstance.toggleIngredient(
      { target: { checked: false } } as unknown as Event,
      { id: 1, name: 'Harina' },
    );
    expect(fixture.componentInstance.items.length).toBe(0);
    fixture.componentInstance.toggleIngredient(
      { target: { checked: false } } as unknown as Event,
      { id: 2, name: 'Azúcar' },
    );
    expect(fixture.componentInstance.items.length).toBe(0);
  });

  it('save sends procedure as array and calls create', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.form.patchValue({
      name: 'Torta',
      servings: 8,
      prepTime: 60,
      procedure: 'Paso 1\nPaso 2',
      notes: '',
      photoPath: null,
    });
    fixture.componentInstance.addItem();
    fixture.componentInstance.items
      .at(0)
      .setValue({ ingredientName: 'Harina', quantity: 500, unit: 'g' });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    const body = service.create.mock.calls[0][0];
    expect(body.procedure).toEqual(['Paso 1', 'Paso 2']);
    expect(body.items[0]).toMatchObject({
      ingredientName: 'Harina',
      quantity: 500,
      unit: 'g',
    });
  });

  it('loads the recipe when editing', () => {
    service.findOne.mockReturnValue(
      of({
        id: 5,
        name: 'Bizcocho',
        servings: 6,
        prepTime: 45,
        procedure: ['Paso 1', 'Paso 2'],
        notes: 'x',
        photoPath: null,
        items: [
          { ingredientId: 1, ingredientName: 'Harina', quantity: 500, unit: 'g' },
        ],
      }),
    );
    param = '5';
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('name')!.value).toBe('Bizcocho');
    expect(fixture.componentInstance.items.length).toBe(1);
    expect(
      fixture.componentInstance.items.at(0).get('ingredientName')!.value,
    ).toBe('Harina');
  });

  it('loads a recipe with empty optional fields when editing', () => {
    service.findOne.mockReturnValue(
      of({
        id: 6,
        name: 'Bizcocho',
        servings: null,
        prepTime: null,
        procedure: null,
        notes: null,
        photoPath: null,
        items: [],
      }),
    );
    param = '6';
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('servings')!.value).toBeNull();
    expect(fixture.componentInstance.form.get('procedure')!.value).toBe('');
    expect(fixture.componentInstance.items.length).toBe(0);
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('saves a recipe with a null procedure', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.form.patchValue({ name: 'Torta' });
    fixture.componentInstance.form.get('procedure')!.setValue(
      null as unknown as string,
    );
    fixture.componentInstance.addItem();
    fixture.componentInstance.items
      .at(0)
      .setValue({ ingredientName: 'Harina', quantity: 1, unit: 'g' });
    fixture.componentInstance.save();
    const body = service.create.mock.calls[0][0];
    expect(body.procedure).toEqual([]);
  });

  it('updates the photoPath control when a photo is selected', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.detectChanges();
    const upload = fixture.debugElement.query(
      By.directive(PhotoUploadComponent),
    );
    upload.componentInstance.urlChange.emit('/uploads/r.png');
    expect(fixture.componentInstance.form.get('photoPath')!.value).toBe(
      '/uploads/r.png',
    );
  });
});
