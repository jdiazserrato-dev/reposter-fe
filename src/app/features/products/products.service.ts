import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Product } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(ApiService);

  findAll(): Observable<Product[]> {
    return this.api.get<Product[]>('/products');
  }

  findOne(id: number): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  create(body: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/products', body);
  }

  update(id: number, body: Partial<Product>): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }
}
