import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { IngredientFormComponent } from './ingredient-form.component';
import { IngredientsService } from './ingredients.service';

describe('IngredientFormComponent', () => {
  let service: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let param: string | null = null;
  const route = { snapshot: { paramMap: { get: () => param } } };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [IngredientFormComponent],
      providers: [
        { provide: IngredientsService, useValue: service },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('creates an ingredient when the form is valid', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(IngredientFormComponent);
    fixture.componentInstance.form.setValue({ name: 'Harina' });
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(service.create).toHaveBeenCalledWith({ name: 'Harina' });
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(IngredientFormComponent);
    fixture.componentInstance.form.setValue({ name: '' });
    fixture.componentInstance.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('loads the ingredient when editing', () => {
    service.findOne.mockReturnValue(of({ id: 5, name: 'Azúcar' }));
    param = '5';
    const fixture = TestBed.createComponent(IngredientFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('name')!.value).toBe('Azúcar');
  });
});
