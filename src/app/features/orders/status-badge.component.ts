import { Component, input } from '@angular/core';
import { OrderStatus } from '../../models';

@Component({
  selector: 'app-status-badge',
  template: `<span
    class="rounded px-2 py-0.5 text-xs font-semibold"
    [class]="classFor(status())"
  >{{ statusLabel(status()) }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  private readonly labels: Record<OrderStatus, string> = {
    ['PENDING']: 'Pendiente',
    ['IN_PRODUCTION']: 'En producción',
    ['READY_FOR_DELIVERY']: 'Listo para entrega',
    ['DELIVERED']: 'Entregado',
    ['CANCELLED']: 'Cancelado',
  };

  private readonly classes: Record<OrderStatus, string> = {
    ['PENDING']: 'bg-amber-100 text-amber-700',
    ['IN_PRODUCTION']: 'bg-sky-100 text-sky-700',
    ['READY_FOR_DELIVERY']: 'bg-violet-100 text-violet-700',
    ['DELIVERED']: 'bg-emerald-100 text-emerald-700',
    ['CANCELLED']: 'bg-rose-100 text-rose-700',
  };

  statusLabel(status: OrderStatus): string {
    return this.labels[status];
  }

  classFor(status: OrderStatus): string {
    return this.classes[status] ?? '';
  }
}
