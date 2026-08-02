import { Component, input } from '@angular/core';
import { OrderStatus } from '../../models';

@Component({
  selector: 'app-status-badge',
  template: `<span
    class="status-chip"
    [class]="classFor(status())"
  ><span class="status-dot"></span>{{ statusLabel(status()) }}</span>`,
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
    ['PENDING']: 'bg-[#fff3c4] text-[#8a6a00]',
    ['IN_PRODUCTION']: 'bg-[#dbeafe] text-[#1d4ed8]',
    ['READY_FOR_DELIVERY']: 'bg-[#ede9fe] text-[#6d28d9]',
    ['DELIVERED']: 'bg-[#d1fae5] text-[#047857]',
    ['CANCELLED']: 'bg-[#fee2e2] text-[#b3261e]',
  };

  statusLabel(status: OrderStatus): string {
    return this.labels[status];
  }

  classFor(status: OrderStatus): string {
    return this.classes[status] ?? '';
  }
}
