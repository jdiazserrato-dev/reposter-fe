import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Ingredient } from '../../models';
import { IngredientsService } from './ingredients.service';

@Component({
  selector: 'app-ingredients-list',
  imports: [RouterLink],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Ingredientes</h2>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo ingrediente</a>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr><th>Nombre</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (ingredient of ingredients(); track ingredient.id) {
            <tr class="border-t">
              <td>{{ ingredient.name }}</td>
              <td class="flex gap-2">
                <a [routerLink]="[ingredient.id]" class="btn btn-secondary">Editar</a>
                <button type="button" class="btn btn-danger" (click)="remove(ingredient)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="2" class="py-4 text-center text-stone-400">Sin ingredientes registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class IngredientsListComponent implements OnInit {
  private readonly service = inject(IngredientsService);
  protected readonly ingredients = signal<Ingredient[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.ingredients.set(list));
  }

  remove(ingredient: Ingredient): void {
    this.service.remove(ingredient.id).subscribe(() => this.load());
  }
}
