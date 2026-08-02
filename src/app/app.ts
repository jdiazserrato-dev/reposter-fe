import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

interface Gate {
  label: string;
  path: string;
  number: string;
}

const GATES: Gate[] = [
  { label: 'Panel', path: '/dashboard', number: '01' },
  { label: 'Pedidos', path: '/pedidos', number: '02' },
  { label: 'Recetas', path: '/recetas', number: '03' },
  { label: 'Productos', path: '/productos', number: '04' },
  { label: 'Clientes', path: '/clientes', number: '05' },
  { label: 'Ingredientes', path: '/ingredientes', number: '06' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly gates = GATES;
  protected readonly destination = signal<string>('Panel');

  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const gate = GATES.find((g) =>
          event.urlAfterRedirects.startsWith(g.path),
        );
        this.destination.set(gate?.label ?? 'Panel');
      }
    });
  }
}
