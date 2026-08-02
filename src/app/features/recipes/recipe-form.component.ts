import { Component, inject, signal, type OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type Ingredient, type RecipeItem, type Unit } from '../../models';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipesService } from './recipes.service';

type RecipeItemForm = FormGroup<{
  ingredientName: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<Unit>;
}>;

@Component({
  selector: 'app-recipe-form',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploadComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar receta' : 'Nueva receta' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-2xl">
      <div class="field">
        <label class="label" for="name">Nombre</label>
        <input id="name" class="input" formControlName="name" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label class="label" for="servings">Porciones</label>
          <input id="servings" type="number" min="0" class="input" formControlName="servings" />
        </div>
        <div class="field">
          <label class="label" for="prepTime">Tiempo (min)</label>
          <input id="prepTime" type="number" min="0" class="input" formControlName="prepTime" />
        </div>
      </div>
      <div class="field">
        <div class="label">Ingredientes</div>
        <div class="mb-2 flex flex-wrap gap-2">
          @for (ingredient of ingredients(); track ingredient.id) {
            <label class="flex items-center gap-1 rounded border px-2 py-1">
              <input type="checkbox" [value]="ingredient" (change)="toggleIngredient($event, ingredient)" />
              {{ ingredient.name }}
            </label>
          }
        </div>
        <div formArrayName="items" class="space-y-2">
          @for (item of items.controls; track item; let i = $index) {
            <div [formGroupName]="i" class="flex items-center gap-2">
              <input formControlName="ingredientName" class="input" placeholder="Ingrediente" />
              <input formControlName="quantity" type="number" step="0.001" min="0" class="input w-24" placeholder="Cant." />
              <select formControlName="unit" class="select w-24">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="und">und</option>
              </select>
              <button type="button" class="btn btn-danger" (click)="removeItem(i)">X</button>
            </div>
          }
        </div>
        <button type="button" class="btn btn-secondary mt-2" (click)="addItem()">+ Agregar ingrediente</button>
      </div>
      <div class="field">
        <label class="label" for="procedure">Procedimiento (un paso por línea)</label>
        <textarea id="procedure" rows="5" class="textarea" formControlName="procedure"></textarea>
      </div>
      <div class="field">
        <label class="label" for="notes">Notas</label>
        <textarea id="notes" rows="2" class="textarea" formControlName="notes"></textarea>
      </div>
      <div class="field">
        <div class="label">Foto del resultado</div>
        <app-photo-upload [url]="form.get('photoPath')!.value" kind="recipes" (urlChange)="onPhoto($event)" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/recetas" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class RecipeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RecipesService);
  private readonly ingredientsService = inject(IngredientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly ingredients = signal<Ingredient[]>([]);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    servings: [null as number | null],
    prepTime: [null as number | null],
    procedure: [''],
    notes: [''],
    photoPath: [null as string | null],
    items: this.fb.array<RecipeItemForm>([]),
  });

  get items(): FormArray<RecipeItemForm> {
    return this.form.get('items') as FormArray<RecipeItemForm>;
  }

  ngOnInit(): void {
    this.ingredientsService
      .findAll()
      .subscribe((list) => this.ingredients.set(list));
    if (this.id) {
      this.service.findOne(this.id).subscribe((r) => {
        this.form.patchValue({
          name: r.name,
          servings: r.servings ?? null,
          prepTime: r.prepTime ?? null,
          procedure: (r.procedure ?? []).join('\n'),
          notes: r.notes ?? '',
          photoPath: r.photoPath ?? null,
        });
        r.items.forEach((item) => this.items.push(this.newItem(item)));
      });
    }
  }

  newItem(item?: RecipeItem): RecipeItemForm {
    return this.fb.nonNullable.group({
      ingredientName: [item?.ingredientName ?? '', [Validators.required]],
      quantity: [
        item?.quantity ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      unit: [(item?.unit ?? 'g') as Unit, [Validators.required]],
    });
  }

  addItem(): void {
    this.items.push(this.newItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  toggleIngredient(event: Event, ingredient: Ingredient): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.items.push(
        this.newItem({
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: 0,
          unit: 'g',
        }),
      );
    } else {
      const index = this.items.controls.findIndex(
        (c) => c.get('ingredientName')!.value === ingredient.name,
      );
      if (index >= 0) this.items.removeAt(index);
    }
  }

  onPhoto(url: string | null): void {
    this.form.get('photoPath')!.setValue(url);
  }

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const body = {
      name: value.name,
      servings: value.servings,
      prepTime: value.prepTime,
      procedure: (value.procedure ?? '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean),
      notes: value.notes,
      photoPath: value.photoPath,
      items: value.items as RecipeItem[],
    };
    const request = this.id
      ? this.service.update(this.id, body)
      : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/recetas']));
  }
}



