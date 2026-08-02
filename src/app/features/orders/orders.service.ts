import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { type Order, type OrderStatus } from '../../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiService);

  findAll(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders');
  }

  findOne(id: number): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  create(body: unknown): Observable<Order> {
    return this.api.post<Order>('/orders', body);
  }

  update(id: number, body: unknown): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}`, body);
  }

  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/status`, { status });
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/orders/${id}`);
  }
}
