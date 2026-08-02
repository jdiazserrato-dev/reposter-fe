import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from '../../models';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'IN_PRODUCTION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink],
  template: `
    <div class="card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Pedidos</h1>
        <a routerLink="nuevo" class="btn btn-primary">Nuevo pedido</a>
      </div>
      @if (orders().length === 0) {
        <p class="text-gray-500">No hay pedidos registrados.</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b text-gray-500">
                <th class="py-2">Folio</th>
                <th class="py-2">Cliente</th>
                <th class="py-2">Total</th>
                <th class="py-2">Fecha de entrega</th>
                <th class="py-2">Estado</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr class="border-b">
                  <td class="py-2 font-semibold">{{ order.orderNumber }}</td>
                  <td class="py-2">{{ order.client.name }}</td>
                  <td class="py-2">\${{ order.totalAmount }}</td>
                  <td class="py-2">{{ order.deliveryDate.slice(0, 10) }}</td>
                  <td class="py-2">
                    <select
                      class="border rounded px-2 py-1 text-xs"
                      [value]="order.status"
                      (change)="onStatus(order, $event)"
                    >
                      @for (status of allStatuses; track status) {
                        <option [value]="status">{{ status }}</option>
                      }
                    </select>
                  </td>
                  <td class="py-2 text-right">
                    <a routerLink="{{ order.id }}" class="text-sky-600 hover:underline">Ver / Editar</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  public readonly orders = signal<Order[]>([]);
  protected readonly allStatuses = ORDER_STATUSES;

  private readonly service = inject(OrdersService);

  ngOnInit(): void {
    this.service.findAll().subscribe((data) => this.orders.set(data));
  }

  onStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    this.service.updateStatus(order.id, status).subscribe((updated) => {
      this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    });
  }
}
