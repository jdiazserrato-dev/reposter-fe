import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Product } from '../../models';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-products-list',
  imports: [RouterLink],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Productos</h2>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo producto</a>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Foto</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (product of products(); track product.id) {
            <tr class="border-t">
              <td>{{ product.name }}</td>
              <td>{{ product.category }}</td>
              <td>{{ '$' + product.basePrice }}</td>
              <td>
                @if (product.photoPath) {
                  <img [src]="product.photoPath" class="h-10 w-10 rounded object-cover" alt="" />
                }
              </td>
              <td class="flex gap-2">
                <a [routerLink]="[product.id]" class="btn btn-secondary">Editar</a>
                <button type="button" class="btn btn-danger" (click)="remove(product)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-4 text-center text-stone-400">Sin productos registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ProductsListComponent implements OnInit {
  private readonly service = inject(ProductsService);
  protected readonly products = signal<Product[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.products.set(list));
  }

  remove(product: Product): void {
    this.service.remove(product.id).subscribe(() => this.load());
  }
}
