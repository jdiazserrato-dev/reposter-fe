import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../models';
import { StatusBadgeComponent } from '../orders/status-badge.component';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <h1 class="mb-6 text-3xl font-extrabold tracking-tight">Panel del taller</h1>

    @if (summary(); as s) {
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="sign-panel p-4">
          <div class="gate-label mb-1 text-mute">Ingresos semana</div>
          <div class="gate-number text-3xl">\${{ s.revenueWeek }}</div>
        </div>
        <div class="sign-panel p-4">
          <div class="gate-label mb-1 text-mute">Ingresos mes</div>
          <div class="gate-number text-3xl">\${{ s.revenueMonth }}</div>
        </div>
        <div class="sign-panel p-4">
          <div class="gate-label mb-1 text-mute">Ingresos año</div>
          <div class="gate-number text-3xl">\${{ s.revenueYear }}</div>
        </div>
        <div class="sign-panel p-4">
          <div class="gate-label mb-1 text-mute">Más vendido</div>
          <div class="gate-number text-xl">
            @if (s.topProduct) {
              {{ s.topProduct.productName }}
              <span class="text-mute">· {{ s.topProduct.quantity }}</span>
            } @else {
              <span class="text-mute">Sin datos</span>
            }
          </div>
        </div>
      </div>

      <div class="sign-panel mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span class="gate-label text-mute">Producción</span>
        <div class="flex flex-wrap items-center gap-2">
          <span class="band band-ink rounded-sm">
            <span class="status-dot" style="background:var(--color-signal)"></span>
            En proceso · {{ inProcess(s) }}
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-ink" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span class="band band-signal rounded-sm">
            <span class="status-dot" style="background:var(--color-ink)"></span>
            Entregados · {{ s.deliveredCount }}
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-ink" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span class="band band-danger rounded-sm">
            <span class="status-dot"></span>
            Cancelados · {{ s.cancelledCount }}
          </span>
        </div>
      </div>

      <h2 class="mt-8 mb-3 text-lg font-extrabold">Próximas salidas</h2>
      <div class="sign-panel overflow-x-auto">
        <table class="board w-full text-left text-sm">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (order of s.recentOrders; track order.id) {
              <tr>
                <td class="font-bold">{{ order.orderNumber }}</td>
                <td>{{ order.client.name }}</td>
                <td class="font-semibold">\${{ order.totalAmount }}</td>
                <td><app-status-badge [status]="order.status" /></td>
                <td class="text-left">
                  <a [routerLink]="['/pedidos', order.id]" class="inline-flex items-center gap-1 font-bold text-ink underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
                    Pedido {{ order.id }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="py-6 text-center text-mute">Sin pedidos recientes.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="sign-panel p-6 text-mute">Cargando señales…</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(DashboardService);
  protected readonly summary = signal<DashboardSummary | null>(null);

  ngOnInit(): void {
    this.service.summary().subscribe((s) => this.summary.set(s));
  }

  inProcess(s: DashboardSummary): number {
    return Math.max(0, s.ordersCount - s.deliveredCount);
  }
}
