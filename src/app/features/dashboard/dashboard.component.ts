import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../models';
import { StatusBadgeComponent } from '../orders/status-badge.component';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">Dashboard</h2>
    @if (summary(); as s) {
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="card"><div class="text-sm text-stone-500">Ingresos semana</div><div class="text-2xl font-bold">\${{ s.revenueWeek }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Ingresos mes</div><div class="text-2xl font-bold">\${{ s.revenueMonth }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Ingresos año</div><div class="text-2xl font-bold">\${{ s.revenueYear }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Pedidos</div><div class="text-2xl font-bold">{{ s.ordersCount }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Entregados</div><div class="text-2xl font-bold">{{ s.deliveredCount }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Cancelados</div><div class="text-2xl font-bold">{{ s.cancelledCount }}</div></div>
        <div class="card md:col-span-2">
          <div class="text-sm text-stone-500">Producto más vendido</div>
          <div class="text-xl font-bold">
            @if (s.topProduct) {
              {{ s.topProduct.productName }} ({{ s.topProduct.quantity }})
            } @else {
              Sin datos
            }
          </div>
        </div>
      </div>
      <h3 class="mb-2 mt-6 text-lg font-bold">Pedidos recientes</h3>
      <div class="card overflow-x-auto">
        <table class="w-full text-left">
          <thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>
            @for (order of s.recentOrders; track order.id) {
              <tr class="border-t">
                <td><a [routerLink]="['/pedidos', order.id]" class="text-rose-700 underline">{{ order.orderNumber }}</a></td>
                <td>{{ order.client.name }}</td>
                <td>\${{ order.totalAmount }}</td>
                <td><app-status-badge [status]="order.status" /></td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="py-4 text-center text-stone-400">Sin pedidos recientes.</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="card">Cargando…</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(DashboardService);
  protected readonly summary = signal<DashboardSummary | null>(null);

  ngOnInit(): void {
    this.service.summary().subscribe((s) => this.summary.set(s));
  }
}
