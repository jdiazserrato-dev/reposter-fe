import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Recipe } from '../../models';
import { RecipesService } from './recipes.service';

@Component({
  selector: 'app-recipes-list',
  imports: [RouterLink],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Recetas</h2>
      <a routerLink="nuevo" class="btn btn-primary">Nueva receta</a>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr><th>Nombre</th><th>Porciones</th><th>Tiempo (min)</th><th>Foto</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (recipe of recipes(); track recipe.id) {
            <tr class="border-t">
              <td>{{ recipe.name }}</td>
              <td>{{ recipe.servings ?? '-' }}</td>
              <td>{{ recipe.prepTime ?? '-' }}</td>
              <td>
                @if (recipe.photoPath) {
                  <img [src]="recipe.photoPath" class="h-10 w-10 rounded object-cover" alt="" />
                }
              </td>
              <td class="flex gap-2">
                <a [routerLink]="[recipe.id]" class="btn btn-secondary">Editar</a>
                <button type="button" class="btn btn-danger" (click)="remove(recipe)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-4 text-center text-stone-400">Sin recetas registradas.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class RecipesListComponent implements OnInit {
  private readonly service = inject(RecipesService);
  protected readonly recipes = signal<Recipe[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.recipes.set(list));
  }

  remove(recipe: Recipe): void {
    this.service.remove(recipe.id).subscribe(() => this.load());
  }
}
