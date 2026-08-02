import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Client } from '../../models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly api = inject(ApiService);

  findAll(): Observable<Client[]> {
    return this.api.get<Client[]>('/clients');
  }

  findOne(id: number): Observable<Client> {
    return this.api.get<Client>(`/clients/${id}`);
  }

  create(body: Partial<Client>): Observable<Client> {
    return this.api.post<Client>('/clients', body);
  }

  update(id: number, body: Partial<Client>): Observable<Client> {
    return this.api.patch<Client>(`/clients/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/clients/${id}`);
  }
}
