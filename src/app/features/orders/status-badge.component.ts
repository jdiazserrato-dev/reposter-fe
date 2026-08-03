import { Component, input } from '@angular/core';
import { type OrderStatus } from '../../models';
import { STATUS_OPTIONS } from './order-status';

@Component({
  selector: 'app-status-badge',
  template: `<span
    class="status-chip"
    [class]="classFor(status())"
  ><span class="status-dot"></span>{{ statusLabel(status()) }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  statusLabel(status: OrderStatus): string {
    return STATUS_OPTIONS[status].label;
  }

  classFor(status: OrderStatus): string {
    return STATUS_OPTIONS[status].color;
  }
}
