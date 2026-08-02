import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from '../../models';
import { StatusBadgeComponent } from './status-badge.component';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'IN_PRODUCTION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-extrabold tracking-tight">Pedidos</h1>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo pedido</a>
    </div>

    @if (orders().length === 0) {
      <div class="sign-panel p-6 text-mute">No hay pedidos registrados.</div>
    } @else {
      <div class="sign-panel overflow-x-auto">
        <table class="board w-full text-left text-sm">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Fecha de entrega</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr>
                <td class="font-bold">{{ order.orderNumber }}</td>
                <td>{{ order.client.name }}</td>
                <td class="font-semibold">\${{ order.totalAmount }}</td>
                <td>{{ order.deliveryDate.slice(0, 10) }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span [class]="flapClassFor(order.id)">
                      <app-status-badge [status]="order.status" />
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <a routerLink="{{ order.id }}" class="inline-flex items-center gap-1 font-bold text-ink underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
                    Puerta {{ order.id }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <details class="sign-panel mt-6 p-4">
        <summary class="cursor-pointer text-sm font-bold uppercase tracking-wide text-mute hover:text-ink">
          Cambiar estado de un pedido
        </summary>
        <div class="mt-3 flex flex-col gap-2">
          @for (order of orders(); track order.id) {
            <div class="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
              <span class="font-semibold">{{ order.orderNumber }} · {{ order.client.name }}</span>
              <select
                class="select w-auto text-sm"
                [value]="order.status"
                (change)="onStatus(order, $event)"
              >
                @for (status of allStatuses; track status) {
                  <option [value]="status">{{ status }}</option>
                }
              </select>
            </div>
          }
        </div>
      </details>
    }
  `,
})
export class OrdersListComponent implements OnInit {
  public readonly orders = signal<Order[]>([]);
  protected readonly allStatuses = ORDER_STATUSES;
  private readonly flapping = new Set<number>();

  private readonly service = inject(OrdersService);

  ngOnInit(): void {
    this.service.findAll().subscribe((data) => this.orders.set(data));
  }

  onStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    this.flapping.add(order.id);
    this.service.updateStatus(order.id, status).subscribe((updated) => {
      this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      setTimeout(() => this.flapping.delete(order.id), 400);
    });
  }

  flapClassFor(id: number): string {
    return this.flapping.has(id) ? 'flap' : '';
  }
}
