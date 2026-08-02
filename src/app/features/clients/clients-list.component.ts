import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Client } from '../../models';
import { ClientsService } from './clients.service';

@Component({
  selector: 'app-clients-list',
  imports: [RouterLink],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Clientes</h2>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo cliente</a>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr><th>Nombre</th><th>Teléfono</th><th class="w-40"></th></tr></thead>
        <tbody>
          @for (client of clients(); track client.id) {
            <tr class="border-t">
              <td>{{ client.name }}</td>
              <td>{{ client.phone }}</td>
              <td class="flex gap-2">
                <a [routerLink]="[client.id]" class="btn btn-secondary">Editar</a>
                <button type="button" class="btn btn-danger" (click)="remove(client)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="3" class="py-4 text-center text-stone-400">Sin clientes registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ClientsListComponent implements OnInit {
  private readonly service = inject(ClientsService);
  protected readonly clients = signal<Client[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.clients.set(list));
  }

  remove(client: Client): void {
    this.service.remove(client.id).subscribe(() => this.load());
  }
}
