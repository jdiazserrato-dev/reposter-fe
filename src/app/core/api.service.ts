import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`);
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }

  upload(path: string, file: File, kind: string): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return this.http.post<{ url: string }>(`${this.base}${path}`, form);
  }
}
