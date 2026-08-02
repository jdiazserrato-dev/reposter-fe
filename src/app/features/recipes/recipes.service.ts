import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Recipe } from '../../models';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly api = inject(ApiService);

  findAll(): Observable<Recipe[]> {
    return this.api.get<Recipe[]>('/recipes');
  }

  findOne(id: number): Observable<Recipe> {
    return this.api.get<Recipe>(`/recipes/${id}`);
  }

  create(body: Partial<Recipe>): Observable<Recipe> {
    return this.api.post<Recipe>('/recipes', body);
  }

  update(id: number, body: Partial<Recipe>): Observable<Recipe> {
    return this.api.patch<Recipe>(`/recipes/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/recipes/${id}`);
  }
}
