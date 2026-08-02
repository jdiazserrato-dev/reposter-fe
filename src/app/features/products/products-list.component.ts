import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Product } from '../../models';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-products-list',
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-extrabold tracking-tight">Productos</h1>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo producto</a>
    </div>
    <div class="sign-panel overflow-x-auto">
      <table class="board w-full text-left text-sm">
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Foto</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (product of products(); track product.id) {
            <tr>
              <td class="font-bold">{{ product.name }}</td>
              <td>{{ product.category }}</td>
              <td class="font-semibold">\${{ product.basePrice }}</td>
              <td>
                @if (product.photoPath) {
                  <img [src]="product.photoPath" class="h-10 w-10 rounded-sm object-cover" alt="" />
                }
              </td>
              <td>
                <div class="flex gap-2">
                  <a [routerLink]="[product.id]" class="btn btn-secondary">Editar</a>
                  <button type="button" class="btn btn-danger" (click)="remove(product)">Eliminar</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-6 text-center text-mute">Sin productos registrados.</td></tr>
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
