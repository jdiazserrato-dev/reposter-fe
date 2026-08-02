import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Ingredient } from '../../models';

@Injectable({ providedIn: 'root' })
export class IngredientsService {
  private readonly api = inject(ApiService);

  findAll(): Observable<Ingredient[]> {
    return this.api.get<Ingredient[]>('/ingredients');
  }

  findOne(id: number): Observable<Ingredient> {
    return this.api.get<Ingredient>(`/ingredients/${id}`);
  }

  create(body: Partial<Ingredient>): Observable<Ingredient> {
    return this.api.post<Ingredient>('/ingredients', body);
  }

  update(id: number, body: Partial<Ingredient>): Observable<Ingredient> {
    return this.api.patch<Ingredient>(`/ingredients/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/ingredients/${id}`);
  }
}
