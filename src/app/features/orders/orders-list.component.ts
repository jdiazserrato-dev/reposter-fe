import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order, OrderStatus } from '../../models';
import { OrdersService } from './orders.service';
import { STATUS_OPTIONS, ORDER_STATUSES } from './order-status';

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink],
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
              <th>Cerrado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr [class]="rowClassFor(order)">
                <td class="font-bold">{{ order.orderNumber }}</td>
                <td>{{ order.client.name }}</td>
                <td class="font-semibold">\${{ order.totalAmount }}</td>
                <td>{{ order.deliveryDate.slice(0, 10) }}</td>
                <td>
                  <select
                    class="select w-auto text-sm"
                    [class.flap]="flapClassFor(order.id)"
                    [value]="order.status"
                    [disabled]="isClosedFor(order)"
                    (change)="onStatus(order, $event)"
                  >
                    @for (status of allStatuses; track status) {
                      <option [value]="status" [selected]="status === order.status">{{ STATUS_OPTIONS[status].label }}</option>
                    }
                  </select>
                </td>
                <td class="text-center">
                  <input
                    type="checkbox"
                    [id]="'closed-' + order.id"
                    [checked]="isClosedFor(order)"
                    (change)="toggleClosed(order, $event)"
                  />
                </td>
                <td class="text-left">
                  <a routerLink="{{ order.id }}" class="inline-flex items-center gap-1 font-bold text-ink underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
                    Pedido {{ order.id }}
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
    }
  `,
})
export class OrdersListComponent implements OnInit {
  public readonly orders = signal<Order[]>([]);
  protected readonly allStatuses = ORDER_STATUSES;
  protected readonly STATUS_OPTIONS = STATUS_OPTIONS;
  protected readonly closed = signal<Set<number>>(new Set());
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

  toggleClosed(order: Order, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.closed.update((set) => {
      const next = new Set(set);
      if (isChecked) {
        next.add(order.id);
      } else {
        next.delete(order.id);
      }
      return next;
    });
  }

  flapClassFor(id: number): string {
    return this.flapping.has(id) ? 'flap' : '';
  }

  rowClassFor(order: Order): string {
    return this.isClosedFor(order) ? 'opacity-50' : '';
  }

  isClosedFor(order: Order): boolean {
    return this.closed().has(order.id) || order.status === 'DELIVERED' || order.status === 'CANCELLED';
  }
}
