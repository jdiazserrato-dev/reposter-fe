import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Ingredient } from '../../models';
import { IngredientsService } from './ingredients.service';

@Component({
  selector: 'app-ingredients-list',
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-extrabold tracking-tight">Ingredientes</h1>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo ingrediente</a>
    </div>
    <div class="sign-panel overflow-x-auto">
      <table class="board w-full text-left text-sm">
        <thead><tr><th>Nombre</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (ingredient of ingredients(); track ingredient.id) {
            <tr>
              <td class="font-bold">{{ ingredient.name }}</td>
              <td>
                <div class="flex gap-2">
                  <a [routerLink]="[ingredient.id]" class="btn btn-secondary">Editar</a>
                  <button type="button" class="btn btn-danger" (click)="remove(ingredient)">Eliminar</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="2" class="py-6 text-center text-mute">Sin ingredientes registrados.</td></tr>
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
