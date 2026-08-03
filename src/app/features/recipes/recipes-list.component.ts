import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Recipe } from '../../models';
import { RecipesService } from './recipes.service';

@Component({
  selector: 'app-recipes-list',
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-extrabold tracking-tight">Recetas</h1>
      <a routerLink="nuevo" class="btn btn-primary">Nueva receta</a>
    </div>
    <div class="sign-panel overflow-x-auto">
      <table class="board w-full text-left text-sm">
        <thead><tr><th>Nombre</th><th>Porciones</th><th>Tiempo (min)</th><th>Foto</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (recipe of recipes(); track recipe.id) {
            <tr>
              <td class="font-bold">{{ recipe.name }}</td>
              <td>{{ recipe.servings ?? '-' }}</td>
              <td>{{ recipe.prepTime ?? '-' }}</td>
              <td>
                @if (recipe.photoPath) {
                  <img [src]="recipe.photoPath" class="h-10 w-10 rounded-sm object-cover" alt="" />
                }
              </td>
              <td>
                <div class="flex gap-2">
                  <button type="button" class="btn btn-secondary" (click)="open(recipe)">Ver</button>
                  <a [routerLink]="[recipe.id]" class="btn btn-secondary">Editar</a>
                  <button type="button" class="btn btn-danger" (click)="remove(recipe)">Eliminar</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-6 text-center text-mute">Sin recetas registradas.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (selectedRecipe()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="onBackdropClick($event)" tabindex="0" (keydown.esc)="close()">
        <div class="sign-panel max-w-2xl rounded-sm p-6 shadow-xl">
          <div class="mb-4 flex items-start justify-between">
            <h2 class="text-2xl font-extrabold">{{ selectedRecipe()!.name }}</h2>
            <button type="button" class="text-mute hover:text-ink" (click)="close()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mb-4 flex gap-4 text-sm">
            @if (selectedRecipe()!.servings) {
              <span><strong>Porciones:</strong> {{ selectedRecipe()!.servings }}</span>
            }
            @if (selectedRecipe()!.prepTime) {
              <span><strong>Tiempo:</strong> {{ selectedRecipe()!.prepTime }} min</span>
            }
          </div>
          <div class="grid grid-cols-[1fr_200px] items-start gap-4">
            @if (selectedRecipe()!.items.length) {
              <div>
                <h3 class="mb-2 text-sm font-bold uppercase text-mute">Ingredientes</h3>
                <ul class="space-y-1 text-sm">
                  @for (item of selectedRecipe()!.items; track item.id) {
                    <li>{{ item.quantity }} {{ item.unit }} — {{ item.ingredientName }}</li>
                  }
                </ul>
              </div>
            }
            @if (selectedRecipe()!.photoPath) {
              <img [src]="selectedRecipe()!.photoPath" class="h-40 w-full rounded-sm object-cover" alt="" />
            }
          </div>
          @if (selectedRecipe()!.procedure?.length) {
            <div class="mb-4">
              <h3 class="mb-2 text-sm font-bold uppercase text-mute">Procedimiento</h3>
              <ol class="space-y-1 text-sm">
                @for (step of selectedRecipe()!.procedure!; track $index) {
                  <li>{{ $index + 1 }}. {{ step }}</li>
                }
              </ol>
            </div>
          }
          @if (selectedRecipe()!.notes) {
            <div>
              <h3 class="mb-2 text-sm font-bold uppercase text-mute">Notas</h3>
              <p class="whitespace-pre-wrap text-sm">{{ selectedRecipe()!.notes }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class RecipesListComponent implements OnInit {
  private readonly service = inject(RecipesService);
  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly selectedRecipe = signal<Recipe | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.recipes.set(list));
  }

  open(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
  }

  close(): void {
    this.selectedRecipe.set(null);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  remove(recipe: Recipe): void {
    this.service.remove(recipe.id).subscribe(() => this.load());
  }
}
