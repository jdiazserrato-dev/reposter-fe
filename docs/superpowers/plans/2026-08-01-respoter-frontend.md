# Respoter Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la SPA Angular 21 de Respoter (dashboard, pedidos, recetas, productos, clientes, ingredientes) consumiendo la API `/api`, con cobertura ≥ 95% y CI verde.

**Architecture:** Angular 21 standalone, control flow `@if`/`@for`, Tailwind CSS, lazy-loading por feature. `ApiService` centraliza las llamadas a `/api`. Cada feature: servicio + componentes (lista y formulario) + specs. Sin SSR (se elimina); en dev el proxy `/api` apunta a `http://localhost:3000`.

**Tech Stack:** Angular 21, TypeScript, Tailwind v4, Vitest (builder `@angular/build:unit-test`), ESLint + @angular-eslint.

## Global Constraints

- TypeScript estricto. Scaffolding del CLI de Angular. Componentes standalone.
- No usar `*ngIf`/`*ngFor`; usar control flow `@if`/`@for`.
- Cobertura ≥ 95% (statements/branches/functions/lines) configurada en el test target de `angular.json`. Tests con Vitest + TestBed, sin reflection.
- Workflows `.github` deben pasar en PRs hacia `develop`/`master`.
- No añadir comentarios al código salvo que se pida.

---

## File Structure

```
reposter-fe/
├─ angular.json            (test options + thresholds, serve proxyConfig, sin SSR)
├─ eslint.config.js        (generado por @angular-eslint)
├─ proxy.conf.json
├─ package.json            (scripts lint, test:cov; sin serve:ssr)
├─ README.md
├─ src/
│  ├─ styles.css           (clases utilitarias .btn .card .input…)
│  ├─ main.ts
│  └─ app/
│     ├─ app.ts / app.html / app.css / app.spec.ts
│     ├─ app.config.ts     (provideHttpClient, sin hydration)
│     ├─ app.routes.ts     (lazy por feature)
│     ├─ core/api.service.ts (+ spec)
│     ├─ models/index.ts
│     ├─ shared/photo-upload.component.ts (+ spec)
│     └─ features/
│        ├─ dashboard/   (service, component, routes, specs)
│        ├─ clients/     (service, routes, list, form, specs)
│        ├─ ingredients/ (idem)
│        ├─ products/    (idem)
│        ├─ recipes/     (idem + checker)
│        └─ orders/      (idem + status-badge)
```

---

### Task 1: Infraestructura (eslint, cobertura, proxy, sin SSR)

**Files:**
- Modify: `package.json`, `angular.json`, `src/app/app.config.ts`
- Create: `proxy.conf.json`
- Delete: `src/server.ts`, `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts`

**Interfaces:**
- Produces: scripts `lint` y `test:cov`; test target con umbrales; proxy `/api`; bootstrap solo cliente (sin SSR).

- [ ] **Step 1: Añadir ESLint para Angular**

Run: `npx ng add @angular-eslint/schematics`
Expected: instala dependencias y crea `eslint.config.js`.

Verifica: `npx eslint .` termina sin errores de configuración.

- [ ] **Step 2: Añadir scripts a `package.json`**

```json
    "lint": "eslint .",
    "test:cov": "ng test --watch=false --coverage"
```

Elimina la línea `"serve:ssr:reposter-fe": ...`.

- [ ] **Step 3: Configurar test y proxy en `angular.json`**

Sustituye el bloque `"test"` por:

```json
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "runner": "vitest",
            "coverage": true,
            "coverageReporters": ["text-summary", "html", "lcov"],
            "coverageThresholds": {
              "statements": 95,
              "branches": 95,
              "functions": 95,
              "lines": 95
            },
            "coverageExclude": [
              "**/features/*/*.routes.ts",
              "**/app.routes.ts",
              "**/app.config.ts",
              "**/main.ts",
              "**/main.server.ts"
            ]
          }
        }
```

Sustituye el bloque `"serve"` por:

```json
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "proxyConfig": "proxy.conf.json"
          },
          "configurations": {
            "production": {
              "buildTarget": "reposter-fe:build:production"
            },
            "development": {
              "buildTarget": "reposter-fe:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
```

En `"build"` → `"options"`: elimina `"server": "src/main.server.ts"` y el bloque `"ssr": { "entry": "src/server.ts" }`; cambia `"outputMode": "server"` por `"outputMode": "static"`.

- [ ] **Step 4: Crear `proxy.conf.json`**

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

- [ ] **Step 5: Eliminar SSR**

Borra: `src/server.ts`, `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts`.

Reescribe `src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideHttpClient()],
};
```

`src/main.ts` no cambia.

- [ ] **Step 6: Verificar build**

Run: `npm run build`
Expected: compila sin SSR.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: eslint, vitest coverage, proxy, remove ssr"
```

---

### Task 2: Modelos, ApiService y shell de la app

**Files:**
- Create: `src/app/models/index.ts`, `src/app/core/api.service.ts`, `src/app/core/api.service.spec.ts`
- Modify: `src/app/app.ts`, `src/app/app.html`, `src/app/app.css`, `src/app/app.routes.ts`, `src/app/app.spec.ts`, `src/styles.css`

**Interfaces:**
- Produces: `ApiService` (`get/post/patch/delete/upload`), interfaces de dominio, shell con sidebar y rutas lazy.

- [ ] **Step 1: Escribir los modelos — `src/app/models/index.ts`**

```ts
export interface Client { id: number; name: string; phone: string; }
export interface Product { id: number; name: string; category: string; basePrice: number; photoPath?: string | null; }
export interface Ingredient { id: number; name: string; }
export type Unit = 'g' | 'ml' | 'und';
export interface RecipeItem { id?: number; ingredientId?: number | null; ingredientName: string; quantity: number; unit: Unit; }
export interface Recipe {
  id: number;
  name: string;
  servings?: number | null;
  prepTime?: number | null;
  procedure?: string[] | null;
  notes?: string | null;
  photoPath?: string | null;
  items: RecipeItem[];
}
export type OrderStatus = 'PENDING' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export interface OrderItem { id?: number; productId?: number | null; productName: string; quantity: number; unitPrice: number; subtotal?: number; }
export interface Order {
  id: number;
  orderNumber: string;
  clientId: number;
  client: Client;
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  notes?: string | null;
  photoPath?: string | null;
  items: OrderItem[];
}
export interface TopProduct { productId: number | null; productName: string; quantity: number; }
export interface DashboardSummary {
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  ordersCount: number;
  deliveredCount: number;
  cancelledCount: number;
  topProduct: TopProduct | null;
  recentOrders: Order[];
}
```

- [ ] **Step 2: Escribir el test del ApiService — `src/app/core/api.service.spec.ts`**

```ts
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('get calls /api/path', () => {
    service.get<{ ok: boolean }>('/things').subscribe((v) => expect(v.ok).toBe(true));
    const req = http.expectOne('/api/things');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('post sends body to /api/path', () => {
    service.post<{ id: number }>('/things', { a: 1 }).subscribe();
    const req = http.expectOne('/api/things');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ a: 1 });
    req.flush({ id: 1 });
  });

  it('patch sends body to /api/path/:id', () => {
    service.patch<{ id: number }>('/things/1', { a: 2 }).subscribe();
    const req = http.expectOne('/api/things/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1 });
  });

  it('delete calls /api/path/:id', () => {
    service.delete<void>('/things/1').subscribe();
    const req = http.expectOne('/api/things/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('upload sends FormData with file and kind', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.upload('/uploads', file, 'recipes').subscribe((r) => expect(r.url).toBe('/uploads/recipes/a.png'));
    const req = http.expectOne('/api/uploads');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('kind')).toBe('recipes');
    expect(body.get('file')).toBe(file);
    req.flush({ url: '/uploads/recipes/a.png' });
  });
});
```

- [ ] **Step 3: Escribir el ApiService — `src/app/core/api.service.ts`**

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = '/api';

  constructor(private readonly http: HttpClient) {}

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
```

- [ ] **Step 4: Reescribir el shell — `src/app/app.ts`**

```ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

`src/app/app.html`:

```html
<div class="flex min-h-screen bg-stone-100">
  <aside class="w-56 shrink-0 bg-rose-900 text-rose-50">
    <div class="p-4 text-xl font-bold tracking-wide">Respoter</div>
    <nav class="flex flex-col gap-1 p-2">
      <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-link">Dashboard</a>
      <a routerLink="/pedidos" routerLinkActive="active-link" class="nav-link">Pedidos</a>
      <a routerLink="/recetas" routerLinkActive="active-link" class="nav-link">Recetas</a>
      <a routerLink="/productos" routerLinkActive="active-link" class="nav-link">Productos</a>
      <a routerLink="/clientes" routerLinkActive="active-link" class="nav-link">Clientes</a>
      <a routerLink="/ingredientes" routerLinkActive="active-link" class="nav-link">Ingredientes</a>
    </nav>
  </aside>
  <main class="flex-1 p-6">
    <router-outlet />
  </main>
</div>
```

`src/app/app.css`:

```css
.nav-link { display: block; padding: 0.5rem 0.75rem; border-radius: 0.375rem; color: #ffe4e6; text-decoration: none; }
.nav-link:hover { background-color: rgb(159 18 57 / 0.8); }
.active-link { background-color: rgb(190 18 60); font-weight: 600; }
```

- [ ] **Step 5: Reescribir rutas — `src/app/app.routes.ts`**

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'pedidos', loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ordersRoutes) },
  { path: 'recetas', loadChildren: () => import('./features/recipes/recipes.routes').then((m) => m.recipesRoutes) },
  { path: 'productos', loadChildren: () => import('./features/products/products.routes').then((m) => m.productsRoutes) },
  { path: 'clientes', loadChildren: () => import('./features/clients/clients.routes').then((m) => m.clientsRoutes) },
  { path: 'ingredientes', loadChildren: () => import('./features/ingredients/ingredients.routes').then((m) => m.ingredientsRoutes) },
];
```

- [ ] **Step 6: Actualizar `src/styles.css`** (añadir al final)

```css
.card { background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); padding: 1rem; }
.btn { display: inline-block; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer; border: 0; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: rgb(190 18 60); color: #fff; }
.btn-secondary { background: #e7e5e4; color: #1c1917; }
.btn-danger { background: #fee2e2; color: #991b1b; }
.field { margin-bottom: 1rem; }
.label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
.input, .select, .textarea { width: 100%; padding: 0.5rem; border: 1px solid #d6d3d1; border-radius: 0.375rem; background: #fff; box-sizing: border-box; }
```

- [ ] **Step 7: Reescribir `src/app/app.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Respoter brand and nav links', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Respoter');
    expect(el.querySelectorAll('a.nav-link').length).toBe(6);
  });
});
```

- [ ] **Step 8: Verificar**

Run: `npx ng test --watch=false`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: app shell, models and api service"
```

---

### Task 3: Feature Clientes (patrón de referencia para CRUD)

**Files:**
- Create: `src/app/features/clients/clients.service.ts` (+ `clients.service.spec.ts`)
- Create: `src/app/features/clients/clients.routes.ts`
- Create: `src/app/features/clients/clients-list.component.ts` (+ spec)
- Create: `src/app/features/clients/client-form.component.ts` (+ spec)

**Interfaces:**
- Consumes: `ApiService`, `Client`.
- Produces: rutas hijas `''` (lista) y `'nuevo'`/`:id` (formulario) bajo `/clientes`.

- [ ] **Step 1: Escribir el test del servicio — `src/app/features/clients/clients.service.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ClientsService, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(ClientsService);
  });

  it('findAll calls GET /clients', () => {
    api.get.mockReturnValue(of([{ id: 1 }]));
    service.findAll().subscribe((v) => expect(v).toEqual([{ id: 1 }]));
    expect(api.get).toHaveBeenCalledWith('/clients');
  });

  it('findOne calls GET /clients/:id', () => {
    api.get.mockReturnValue(of({ id: 1 }));
    service.findOne(1).subscribe((v) => expect(v).toEqual({ id: 1 }));
    expect(api.get).toHaveBeenCalledWith('/clients/1');
  });

  it('create calls POST /clients', () => {
    api.post.mockReturnValue(of({ id: 1 }));
    service.create({ name: 'Ana' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/clients', { name: 'Ana' });
  });

  it('update calls PATCH /clients/:id', () => {
    api.patch.mockReturnValue(of({ id: 1 }));
    service.update(1, { name: 'Betty' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/clients/1', { name: 'Betty' });
  });

  it('remove calls DELETE /clients/:id', () => {
    api.delete.mockReturnValue(of(undefined));
    service.remove(1).subscribe();
    expect(api.delete).toHaveBeenCalledWith('/clients/1');
  });
});
```

- [ ] **Step 2: Escribir el servicio — `src/app/features/clients/clients.service.ts`**

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Client } from '../../models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  constructor(private readonly api: ApiService) {}

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
```

- [ ] **Step 3: Escribir las rutas — `src/app/features/clients/clients.routes.ts`**

```ts
import { Routes } from '@angular/router';
import { ClientFormComponent } from './client-form.component';
import { ClientsListComponent } from './clients-list.component';

export const clientsRoutes: Routes = [
  { path: '', component: ClientsListComponent },
  { path: 'nuevo', component: ClientFormComponent },
  { path: ':id', component: ClientFormComponent },
];
```

- [ ] **Step 4: Escribir la lista — `src/app/features/clients/clients-list.component.ts`**

```ts
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
```

- [ ] **Step 5: Escribir el test de la lista — `src/app/features/clients/clients-list.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientsListComponent } from './clients-list.component';
import { ClientsService } from './clients.service';

describe('ClientsListComponent', () => {
  let service: { findAll: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { findAll: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [{ provide: ClientsService, useValue: service }],
    });
  });

  it('renders the client list', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Ana', phone: '3001' }]));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('3001');
  });

  it('shows empty state', () => {
    service.findAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin clientes');
  });

  it('removes a client and reloads', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Ana', phone: '3001' }]));
    service.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button.btn-danger')!.click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 6: Escribir el formulario — `src/app/features/clients/client-form.component.ts`**

```ts
import { Component, inject, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientsService } from './clients.service';

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-md">
      <div class="field">
        <label class="label" for="name">Nombre</label>
        <input id="name" class="input" formControlName="name" />
      </div>
      <div class="field">
        <label class="label" for="phone">Teléfono</label>
        <input id="phone" class="input" formControlName="phone" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/clientes" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\- ]{7,20}$/)]],
  });

  ngOnInit(): void {
    if (this.id) {
      this.service.findOne(this.id).subscribe((c) => this.form.patchValue({ name: c.name, phone: c.phone }));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.value;
    const request = this.id ? this.service.update(this.id, body) : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/clientes']));
  }
}
```

- [ ] **Step 7: Escribir el test del formulario — `src/app/features/clients/client-form.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ClientFormComponent } from './client-form.component';
import { ClientsService } from './clients.service';

describe('ClientFormComponent', () => {
  let service: { findOne: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  const route = { snapshot: { paramMap: { get: () => null } } };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientFormComponent],
      providers: [
        { provide: ClientsService, useValue: service },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
  });

  it('creates a client when the form is valid', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.componentInstance.form.setValue({ name: 'Ana', phone: '3001234567' });
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(service.create).toHaveBeenCalledWith({ name: 'Ana', phone: '3001234567' });
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.componentInstance.form.setValue({ name: '', phone: 'x' });
    fixture.componentInstance.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('loads the client when editing', () => {
    service.findOne.mockReturnValue(of({ id: 5, name: 'Betty', phone: '3002' }));
    const editRoute = { snapshot: { paramMap: { get: () => '5' } } };
    TestBed.overrideProvider(ActivatedRoute, { useValue: editRoute });
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('name')!.value).toBe('Betty');
  });
});
```

- [ ] **Step 8: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS; cobertura global aún < 95% (faltan features).

- [ ] **Step 9: Commit**

```bash
git add src/app/features/clients
git commit -m "feat: clients feature"
```

---

### Task 4: Feature Ingredientes

**Files:**
- Create: `src/app/features/ingredients/ingredients.service.ts` (+ `ingredients.service.spec.ts`)
- Create: `src/app/features/ingredients/ingredients.routes.ts`
- Create: `src/app/features/ingredients/ingredients-list.component.ts` (+ spec)
- Create: `src/app/features/ingredients/ingredient-form.component.ts` (+ spec)

**Interfaces:**
- Consumes: `ApiService`, `Ingredient`.
- Produces: rutas `''`, `'nuevo'`, `:id` bajo `/ingredientes`.

- [ ] **Step 1: Servicio — `src/app/features/ingredients/ingredients.service.ts`**

Mismo código que `ClientsService` con: nombre de clase `IngredientsService`, endpoints `/ingredients`, tipo `Partial<Ingredient>`, y `Observable<Ingredient[]>` en `findAll`.

- [ ] **Step 2: Test del servicio**

Mismo código que `clients.service.spec.ts` con `IngredientsService`, `IngredientsService` como provider, endpoints `/ingredients` y body `{ name: 'Harina' }`.

- [ ] **Step 3: Rutas — `src/app/features/ingredients/ingredients.routes.ts`**

Igual a `clients.routes.ts` con `IngredientFormComponent` y `IngredientsListComponent`.

- [ ] **Step 4: Lista — `src/app/features/ingredients/ingredients-list.component.ts`**

Igual a `ClientsListComponent` con una sola columna `Nombre`, `@for (ingredient of ingredients(); track ingredient.id)`, `remove(ingredient)` y texto vacío "Sin ingredientes registrados.".

- [ ] **Step 5: Formulario — `src/app/features/ingredients/ingredient-form.component.ts`**

Igual a `ClientFormComponent` con un único control `name` (`Validators.required`, `maxLength(120)`), `findOne` precarga el nombre, `save()` navega a `/ingredientes`.

- [ ] **Step 6: Specs**

`ingredients-list.component.spec.ts`: render/empty/remove (patrón ClientsList). `ingredient-form.component.spec.ts`: create válido, no submit inválido, precarga en edición (patrón ClientForm).

- [ ] **Step 7: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/ingredients
git commit -m "feat: ingredients feature"
```

---

### Task 5: PhotoUpload compartido + Feature Productos

**Files:**
- Create: `src/app/shared/photo-upload.component.ts` (+ spec)
- Create: `src/app/features/products/products.service.ts` (+ spec)
- Create: `src/app/features/products/products.routes.ts`
- Create: `src/app/features/products/products-list.component.ts` (+ spec)
- Create: `src/app/features/products/product-form.component.ts` (+ spec)

**Interfaces:**
- Produces: `PhotoUploadComponent` (inputs `url: string|null`, `kind: string`; output `urlChange`). Feature productos con rutas `''`, `'nuevo'`, `:id`; el formulario usa `PhotoUploadComponent`.

- [ ] **Step 1: Escribir el test de PhotoUpload — `src/app/shared/photo-upload.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { PhotoUploadComponent } from './photo-upload.component';

describe('PhotoUploadComponent', () => {
  const api = { upload: vi.fn() };

  beforeEach(() => {
    api.upload.mockReset();
    TestBed.configureTestingModule({
      imports: [PhotoUploadComponent],
      providers: [{ provide: ApiService, useValue: api }],
    });
  });

  it('uploads a file and emits the url', () => {
    const fixture = TestBed.createComponent(PhotoUploadComponent);
    fixture.componentRef.setInput('url', null);
    fixture.componentRef.setInput('kind', 'recipes');
    const emit = vi.fn();
    fixture.componentInstance.urlChange.subscribe(emit);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    api.upload.mockReturnValue(of({ url: '/uploads/recipes/a.png' }));
    const input = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(api.upload).toHaveBeenCalledWith('/uploads', file, 'recipes');
    expect(emit).toHaveBeenCalledWith('/uploads/recipes/a.png');
  });

  it('clears the url', () => {
    const fixture = TestBed.createComponent(PhotoUploadComponent);
    fixture.componentRef.setInput('url', '/uploads/a.png');
    fixture.componentRef.setInput('kind', 'products');
    const emit = vi.fn();
    fixture.componentInstance.urlChange.subscribe(emit);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(emit).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Escribir PhotoUpload — `src/app/shared/photo-upload.component.ts`**

```ts
import { Component, inject, input, output } from '@angular/core';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-photo-upload',
  template: `
    <div class="flex items-center gap-3">
      @if (url()) {
        <img [src]="url()" class="h-20 w-20 rounded object-cover" alt="foto" />
      }
      <input type="file" accept="image/*" (change)="onFile($event)" class="input" />
      @if (url()) {
        <button type="button" class="btn btn-danger" (click)="clear()">Quitar</button>
      }
    </div>
  `,
})
export class PhotoUploadComponent {
  private readonly api = inject(ApiService);
  readonly url = input<string | null>(null);
  readonly kind = input.required<string>();
  readonly urlChange = output<string | null>();

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.upload('/uploads', file, this.kind()).subscribe((res) => this.urlChange.emit(res.url));
  }

  clear(): void {
    this.urlChange.emit(null);
  }
}
```

- [ ] **Step 3: Servicio — `src/app/features/products/products.service.ts`**

Mismo patrón que `ClientsService`: clase `ProductsService`, endpoints `/products`, tipo `Partial<Product>`.

- [ ] **Step 4: Test del servicio** (patrón ClientsService con `/products` y body `{ name: 'Torta', category: 'torta', basePrice: 20 }`).

- [ ] **Step 5: Rutas — `src/app/features/products/products.routes.ts`** (patrón Clients).

- [ ] **Step 6: Lista — `src/app/features/products/products-list.component.ts`**

Columnas: Nombre, Categoría, Precio (`${{ product.basePrice }}`), Foto, acciones. Fila:

```html
<tr class="border-t">
  <td>{{ product.name }}</td>
  <td>{{ product.category }}</td>
  <td>${{ product.basePrice }}</td>
  <td>
    @if (product.photoPath) {
      <img [src]="product.photoPath" class="h-10 w-10 rounded object-cover" alt="" />
    }
  </td>
  <td class="flex gap-2">
    <a [routerLink]="[product.id]" class="btn btn-secondary">Editar</a>
    <button type="button" class="btn btn-danger" (click)="remove(product)">Eliminar</button>
  </td>
</tr>
```

- [ ] **Step 7: Formulario — `src/app/features/products/product-form.component.ts`**

```ts
import { Component, inject, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploadComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar producto' : 'Nuevo producto' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-lg">
      <div class="field">
        <label class="label" for="name">Nombre</label>
        <input id="name" class="input" formControlName="name" />
      </div>
      <div class="field">
        <label class="label" for="category">Categoría</label>
        <input id="category" class="input" formControlName="category" />
      </div>
      <div class="field">
        <label class="label" for="basePrice">Precio base</label>
        <input id="basePrice" type="number" step="0.01" min="0" class="input" formControlName="basePrice" />
      </div>
      <div class="field">
        <label class="label">Foto</label>
        <app-photo-upload [url]="form.get('photoPath')!.value" kind="products" (urlChange)="onPhoto($event)" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/productos" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['', [Validators.required, Validators.maxLength(60)]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    photoPath: [null as string | null],
  });

  ngOnInit(): void {
    if (this.id) {
      this.service.findOne(this.id).subscribe((p) =>
        this.form.patchValue({ name: p.name, category: p.category, basePrice: p.basePrice, photoPath: p.photoPath ?? null }),
      );
    }
  }

  onPhoto(url: string | null): void {
    this.form.get('photoPath')!.setValue(url);
  }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.value;
    const request = this.id ? this.service.update(this.id, body) : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/productos']));
  }
}
```

- [ ] **Step 8: Specs** — lista (render/empty/remove) y formulario (create válido, no submit inválido, precarga con `photoPath`, `onPhoto` actualiza el control), siguiendo los patrones de Clientes con `ProductsService`.

- [ ] **Step 9: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/app/shared src/app/features/products
git commit -m "feat: products feature with photo upload"
```

---

### Task 6: Feature Recetas

**Files:**
- Create: `src/app/features/recipes/recipes.service.ts` (+ spec)
- Create: `src/app/features/recipes/recipes.routes.ts`
- Create: `src/app/features/recipes/recipes-list.component.ts` (+ spec)
- Create: `src/app/features/recipes/recipe-form.component.ts` (+ spec)

**Interfaces:**
- Consumes: `ApiService`, `IngredientsService`, `PhotoUploadComponent`.
- Produces: rutas `''`, `'nuevo'`, `:id` bajo `/recetas`. El formulario tiene un **checker** de ingredientes del catálogo (checkbox por ingrediente) y líneas libres con `quantity` y `unit` (`g`/`ml`/`und`), además de procedimiento (un paso por línea), porciones, tiempo y foto.

- [ ] **Step 1: Servicio — `src/app/features/recipes/recipes.service.ts`**

Mismo patrón que `ClientsService`: clase `RecipesService`, endpoints `/recipes`, tipo `Partial<Recipe>`.

- [ ] **Step 2: Test del servicio** (patrón ClientsService con `/recipes`).

- [ ] **Step 3: Rutas — `src/app/features/recipes/recipes.routes.ts`** (patrón Clients).

- [ ] **Step 4: Lista — `src/app/features/recipes/recipes-list.component.ts`**

Columnas: Nombre, Porciones, Tiempo (min), Foto, acciones. `@for (recipe of recipes(); track recipe.id)`, `remove(recipe)`.

- [ ] **Step 5: Formulario — `src/app/features/recipes/recipe-form.component.ts`**

```ts
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type Ingredient, type RecipeItem, type Unit } from '../../models';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipesService } from './recipes.service';

@Component({
  selector: 'app-recipe-form',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploadComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar receta' : 'Nueva receta' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-2xl">
      <div class="field">
        <label class="label" for="name">Nombre</label>
        <input id="name" class="input" formControlName="name" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label class="label" for="servings">Porciones</label>
          <input id="servings" type="number" min="0" class="input" formControlName="servings" />
        </div>
        <div class="field">
          <label class="label" for="prepTime">Tiempo (min)</label>
          <input id="prepTime" type="number" min="0" class="input" formControlName="prepTime" />
        </div>
      </div>
      <div class="field">
        <label class="label">Ingredientes</label>
        <div class="mb-2 flex flex-wrap gap-2">
          @for (ingredient of ingredients(); track ingredient.id) {
            <label class="flex items-center gap-1 rounded border px-2 py-1">
              <input type="checkbox" [value]="ingredient" (change)="toggleIngredient($event, ingredient)" />
              {{ ingredient.name }}
            </label>
          }
        </div>
        <div formArrayName="items" class="space-y-2">
          @for (item of items.controls; track item; let i = $index) {
            <div [formGroupName]="i" class="flex items-center gap-2">
              <input formControlName="ingredientName" class="input" placeholder="Ingrediente" />
              <input formControlName="quantity" type="number" step="0.001" min="0" class="input w-24" placeholder="Cant." />
              <select formControlName="unit" class="select w-24">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="und">und</option>
              </select>
              <button type="button" class="btn btn-danger" (click)="removeItem(i)">X</button>
            </div>
          }
        </div>
        <button type="button" class="btn btn-secondary mt-2" (click)="addItem()">+ Agregar ingrediente</button>
      </div>
      <div class="field">
        <label class="label" for="procedure">Procedimiento (un paso por línea)</label>
        <textarea id="procedure" rows="5" class="textarea" formControlName="procedure"></textarea>
      </div>
      <div class="field">
        <label class="label" for="notes">Notas</label>
        <textarea id="notes" rows="2" class="textarea" formControlName="notes"></textarea>
      </div>
      <div class="field">
        <label class="label">Foto del resultado</label>
        <app-photo-upload [url]="form.get('photoPath')!.value" kind="recipes" (urlChange)="onPhoto($event)" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/recetas" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class RecipeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RecipesService);
  private readonly ingredientsService = inject(IngredientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly ingredients = signal<Ingredient[]>([]);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    servings: [null as number | null],
    prepTime: [null as number | null],
    procedure: [''],
    notes: [''],
    photoPath: [null as string | null],
    items: this.fb.array<FormGroupItem>([]),
  });
  protected get items(): FormArray<FormGroupItem> {
    return this.form.get('items') as FormArray<FormGroupItem>;
  }

  ngOnInit(): void {
    this.ingredientsService.findAll().subscribe((list) => this.ingredients.set(list));
    if (this.id) {
      this.service.findOne(this.id).subscribe((r) => {
        this.form.patchValue({
          name: r.name,
          servings: r.servings ?? null,
          prepTime: r.prepTime ?? null,
          procedure: (r.procedure ?? []).join('\n'),
          notes: r.notes ?? '',
          photoPath: r.photoPath ?? null,
        });
        r.items.forEach((item) => this.items.push(this.newItem(item)));
      });
    }
  }

  private newItem(item?: RecipeItem): FormGroupItem {
    return this.fb.group({
      ingredientName: [item?.ingredientName ?? '', [Validators.required]],
      quantity: [item?.quantity ?? 0, [Validators.required, Validators.min(0)]],
      unit: [(item?.unit ?? 'g') as Unit, [Validators.required]],
    });
  }

  addItem(): void {
    this.items.push(this.newItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  toggleIngredient(event: Event, ingredient: Ingredient): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.items.push(this.newItem({ ingredientId: ingredient.id, ingredientName: ingredient.name, quantity: 0, unit: 'g' }));
    } else {
      const index = this.items.controls.findIndex((c) => c.get('ingredientName')!.value === ingredient.name);
      if (index >= 0) this.items.removeAt(index);
    }
  }

  onPhoto(url: string | null): void {
    this.form.get('photoPath')!.setValue(url);
  }

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const body = {
      name: value.name,
      servings: value.servings,
      prepTime: value.prepTime,
      procedure: (value.procedure ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean),
      notes: value.notes,
      photoPath: value.photoPath,
      items: value.items as RecipeItem[],
    };
    const request = this.id ? this.service.update(this.id, body) : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/recetas']));
  }
}

type FormGroupItem = ReturnType<RecipeFormComponent['newItem']>;
```

Nota: si TS no permite `ReturnType<RecipeFormComponent['newItem']>` con un método privado, haz `newItem` público. Si `fb.array<FormGroupItem>` no compila con tu versión, usa `fb.array([])` y tipa `items` como `FormArray`.

- [ ] **Step 6: Specs del formulario — `src/app/features/recipes/recipe-form.component.spec.ts`**

Mockeos: `RecipesService` (`findOne`, `create`, `update`), `IngredientsService` (`findAll`) y `ActivatedRoute`. Casos:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeFormComponent } from './recipe-form.component';
import { RecipesService } from './recipes.service';

describe('RecipeFormComponent', () => {
  let service: { findOne: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let ingredients: { findAll: ReturnType<typeof vi.fn> };
  const route = { snapshot: { paramMap: { get: () => null } } };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    ingredients = { findAll: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
      providers: [
        { provide: RecipesService, useValue: service },
        { provide: IngredientsService, useValue: ingredients },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
  });

  it('loads ingredients on init', () => {
    ingredients.findAll.mockReturnValue(of([{ id: 1, name: 'Harina' }]));
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.ingredients()).toEqual([{ id: 1, name: 'Harina' }]);
  });

  it('adds and removes item lines', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.addItem();
    expect(fixture.componentInstance.items.length).toBe(1);
    fixture.componentInstance.removeItem(0);
    expect(fixture.componentInstance.items.length).toBe(0);
  });

  it('toggleIngredient adds a line when checked and removes when unchecked', () => {
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.toggleIngredient({ target: { checked: true } } as unknown as Event, { id: 1, name: 'Harina' });
    expect(fixture.componentInstance.items.at(0).get('ingredientName')!.value).toBe('Harina');
    fixture.componentInstance.toggleIngredient({ target: { checked: false } } as unknown as Event, { id: 1, name: 'Harina' });
    expect(fixture.componentInstance.items.length).toBe(0);
  });

  it('save sends procedure as array and calls create', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(RecipeFormComponent);
    fixture.componentInstance.form.patchValue({
      name: 'Torta', servings: 8, prepTime: 60, procedure: 'Paso 1\nPaso 2', notes: '', photoPath: null,
    });
    fixture.componentInstance.addItem();
    fixture.componentInstance.items.at(0).setValue({ ingredientName: 'Harina', quantity: 500, unit: 'g' });
    fixture.componentInstance.save();
    const body = service.create.mock.calls[0][0];
    expect(body.procedure).toEqual(['Paso 1', 'Paso 2']);
    expect(body.items[0]).toMatchObject({ ingredientName: 'Harina', quantity: 500, unit: 'g' });
  });
});
```

- [ ] **Step 7: Spec de la lista** — render/empty/remove (patrón ClientsList, con `RecipesService`).

- [ ] **Step 8: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/features/recipes
git commit -m "feat: recipes feature with ingredient checker"
```

---

### Task 7: Feature Pedidos

**Files:**
- Create: `src/app/features/orders/orders.service.ts` (+ spec)
- Create: `src/app/features/orders/status-badge.component.ts` (+ spec)
- Create: `src/app/features/orders/orders.routes.ts`
- Create: `src/app/features/orders/orders-list.component.ts` (+ spec)
- Create: `src/app/features/orders/order-form.component.ts` (+ spec)

**Interfaces:**
- Consumes: `ApiService`, `ClientsService`, `ProductsService`, `PhotoUploadComponent`, modelos `Order`/`OrderStatus`.
- Produces: rutas `''`, `'nuevo'`, `:id` bajo `/pedidos`. La lista muestra folio, cliente, total, fecha de entrega y estado (badge) con cambio rápido de estado. El formulario permite elegir cliente existente o crear uno nuevo, agregar líneas (producto del catálogo + cantidad + precio editable), fecha de entrega, notas y foto.

- [ ] **Step 1: Servicio — `src/app/features/orders/orders.service.ts`**

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { type Order, type OrderStatus } from '../../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private readonly api: ApiService) {}

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
```

- [ ] **Step 2: Test del servicio**

Patrón ClientsService con `/orders` y un caso extra: `updateStatus(1, 'DELIVERED')` verifica `patch('/orders/1/status', { status: 'DELIVERED' })`.

- [ ] **Step 3: Badge — `src/app/features/orders/status-badge.component.ts`**

```ts
import { Component, input } from '@angular/core';
import { type OrderStatus } from '../../models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  IN_PRODUCTION: 'En producción',
  READY_FOR_DELIVERY: 'Listo para entrega',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  IN_PRODUCTION: 'bg-sky-100 text-sky-800',
  READY_FOR_DELIVERY: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-stone-200 text-stone-600',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="rounded px-2 py-0.5 text-xs font-semibold {{ classFor(status()) }}">{{ labelFor(status()) }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  labelFor(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  classFor(status: OrderStatus): string {
    return STATUS_CLASSES[status];
  }
}
```

- [ ] **Step 4: Test del badge — `src/app/features/orders/status-badge.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  it('renders the label and class for a status', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'DELIVERED');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toBe('Entregado');
    expect(span.className).toContain('bg-emerald-100');
  });
});
```

- [ ] **Step 5: Rutas — `src/app/features/orders/orders.routes.ts`** (patrón Clients con `OrdersListComponent` y `OrderFormComponent`).

- [ ] **Step 6: Lista — `src/app/features/orders/orders-list.component.ts`**

Columnas: Folio, Cliente, Total, Fecha de entrega, Estado, acciones. Cambio rápido de estado con un `<select>` por fila:

```ts
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Order, type OrderStatus } from '../../models';
import { OrdersService } from './orders.service';
import { StatusBadgeComponent } from './status-badge.component';

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Pedidos</h2>
      <a routerLink="nuevo" class="btn btn-primary">Nuevo pedido</a>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Entrega</th><th>Estado</th><th class="w-32"></th></tr></thead>
        <tbody>
          @for (order of orders(); track order.id) {
            <tr class="border-t">
              <td>{{ order.orderNumber }}</td>
              <td>{{ order.client?.name }}</td>
              <td>${{ order.totalAmount }}</td>
              <td>{{ order.deliveryDate | date: 'dd/MM/yyyy' }}</td>
              <td><app-status-badge [status]="order.status" /></td>
              <td>
                <select class="select" [value]="order.status" (change)="onStatus(order, $event)">
                  @for (s of allStatuses; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </td>
              <td class="flex gap-2">
                <a [routerLink]="[order.id]" class="btn btn-secondary">Editar</a>
                <button type="button" class="btn btn-danger" (click)="remove(order)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="py-4 text-center text-stone-400">Sin pedidos registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  private readonly service = inject(OrdersService);
  protected readonly orders = signal<Order[]>([]);
  protected readonly allStatuses = ALL_STATUSES;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((list) => this.orders.set(list));
  }

  onStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    this.service.updateStatus(order.id, status).subscribe((updated) =>
      this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o))),
    );
  }

  remove(order: Order): void {
    this.service.remove(order.id).subscribe(() => this.load());
  }
}
```

Nota: el `<select>` usa `@for` para las opciones y `app-status-badge` para mostrar el estado actual. El pipe `date` requiere importar `DatePipe` en el componente (o usar `order.deliveryDate.slice(0, 10)` para evitarlo; elige la variante más simple que compile).

- [ ] **Step 7: Formulario — `src/app/features/orders/order-form.component.ts`**

```ts
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type Client, type OrderStatus, type Product } from '../../models';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { OrdersService } from './orders.service';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploadComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar pedido' : 'Nuevo pedido' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-3xl">
      <div class="field">
        <label class="label" for="clientId">Cliente existente</label>
        <select id="clientId" class="select" formControlName="clientId">
          <option [ngValue]="null">— Elegir cliente —</option>
          @for (client of clients(); track client.id) {
            <option [ngValue]="client.id">{{ client.name }} ({{ client.phone }})</option>
          }
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label class="label" for="clientName">Nombre del nuevo cliente</label>
          <input id="clientName" class="input" formControlName="clientName" />
        </div>
        <div class="field">
          <label class="label" for="clientPhone">Teléfono del nuevo cliente</label>
          <input id="clientPhone" class="input" formControlName="clientPhone" />
        </div>
      </div>
      <div class="field">
        <label class="label" for="deliveryDate">Fecha de entrega</label>
        <input id="deliveryDate" type="datetime-local" class="input" formControlName="deliveryDate" />
      </div>
      <div class="field">
        <label class="label">Productos</label>
        <div formArrayName="items" class="space-y-2">
          @for (item of items.controls; track item; let i = $index) {
            <div [formGroupName]="i" class="grid grid-cols-4 items-center gap-2">
              <select formControlName="productId" class="select col-span-2" (change)="onProduct($event, i)">
                <option [ngValue]="null">— Producto —</option>
                @for (product of products(); track product.id) {
                  <option [ngValue]="product.id">{{ product.name }}</option>
                }
              </select>
              <input formControlName="quantity" type="number" min="1" class="input" placeholder="Cant." />
              <div class="flex gap-2">
                <input formControlName="unitPrice" type="number" step="0.01" min="0" class="input" placeholder="Precio" />
                <button type="button" class="btn btn-danger" (click)="removeItem(i)">X</button>
              </div>
            </div>
          }
        </div>
        <button type="button" class="btn btn-secondary mt-2" (click)="addItem()">+ Agregar producto</button>
      </div>
      <div class="field">
        <label class="label">Total: ${{ total() }}</label>
      </div>
      <div class="field">
        <label class="label" for="notes">Notas</label>
        <textarea id="notes" rows="3" class="textarea" formControlName="notes"></textarea>
      </div>
      <div class="field">
        <label class="label">Foto del pedido</label>
        <app-photo-upload [url]="form.get('photoPath')!.value" kind="orders" (urlChange)="onPhoto($event)" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/pedidos" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class OrderFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly clients = signal<Client[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly form = this.fb.nonNullable.group({
    clientId: [null as number | null],
    clientName: [''],
    clientPhone: [''],
    deliveryDate: ['', [Validators.required]],
    notes: [''],
    photoPath: [null as string | null],
    items: this.fb.array<FormGroupItem>([]),
  });
  protected get items(): FormArray<FormGroupItem> {
    return this.form.get('items') as FormArray<FormGroupItem>;
  }

  protected total(): number {
    return this.items.controls.reduce((sum, c) => sum + (Number(c.get('unitPrice')!.value) || 0) * (Number(c.get('quantity')!.value) || 0), 0);
  }

  ngOnInit(): void {
    this.clientsService.findAll().subscribe((list) => this.clients.set(list));
    this.productsService.findAll().subscribe((list) => this.products.set(list));
    if (this.id) {
      this.service.findOne(this.id).subscribe((o) => {
        this.form.patchValue({
          clientId: o.clientId,
          deliveryDate: o.deliveryDate.slice(0, 16),
          notes: o.notes ?? '',
          photoPath: o.photoPath ?? null,
        });
        o.items.forEach((item) => this.items.push(this.newItem(item)));
      });
    } else {
      this.addItem();
    }
  }

  private newItem(item?: { productId?: number | null; productName: string; quantity: number; unitPrice: number }) {
    return this.fb.group({
      productId: [item?.productId ?? null],
      productName: [item?.productName ?? ''],
      quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.newItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onProduct(event: Event, index: number): void {
    const productId = Number((event.target as HTMLSelectElement).value);
    const product = this.products().find((p) => p.id === productId);
    const item = this.items.at(index);
    item.get('productName')!.setValue(product?.name ?? '');
    if (product) item.get('unitPrice')!.setValue(product.basePrice);
  }

  onPhoto(url: string | null): void {
    this.form.get('photoPath')!.setValue(url);
  }

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const body: Record<string, unknown> = {
      deliveryDate: new Date(value.deliveryDate!).toISOString(),
      notes: value.notes,
      photoPath: value.photoPath,
      items: value.items.map((item: Record<string, unknown>) => ({
        productId: item['productId'] ?? null,
        productName: item['productName'],
        quantity: item['quantity'],
        unitPrice: item['unitPrice'],
      })),
    };
    if (value.clientId) {
      body['clientId'] = value.clientId;
    } else if (value.clientName && value.clientPhone) {
      body['client'] = { name: value.clientName, phone: value.clientPhone };
    }
    const request = this.id ? this.service.update(this.id, body) : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/pedidos']));
  }
}

type FormGroupItem = ReturnType<OrderFormComponent['newItem']>;
```

Nota: igual que en recetas, si `ReturnType` con método privado no compila, haz `newItem` público o tipa con `FormArray`.

- [ ] **Step 8: Specs**

`orders-list.component.spec.ts`: render de filas (folio + cliente), empty, `onStatus` llama `updateStatus` y actualiza la señal, `remove` recarga.

`order-form.component.spec.ts` (mockea `OrdersService`, `ClientsService`, `ProductsService`, `ActivatedRoute`):
1. Carga clientes y productos al iniciar; agrega una línea vacía en modo creación.
2. Precarga datos al editar (patch + líneas).
3. `onProduct` completa `productName` y `unitPrice` desde el catálogo.
4. `total()` suma líneas.
5. `save` con `clientId` envía body con `clientId`; con nombre+teléfono envía `client`; sin ambos no envía cliente.
6. `save` inválido no llama al servicio.

- [ ] **Step 9: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/app/features/orders
git commit -m "feat: orders feature with status and photo"
```

---

### Task 8: Feature Dashboard

**Files:**
- Create: `src/app/features/dashboard/dashboard.service.ts` (+ spec)
- Create: `src/app/features/dashboard/dashboard.component.ts` (+ spec)
- Create: `src/app/features/dashboard/dashboard.routes.ts` (opcional; la ruta es `loadComponent` directa)

**Interfaces:**
- Consumes: `ApiService`, `DashboardSummary`.
- Produces: `DashboardComponent` (componente de la ruta `/dashboard`) que muestra tarjetas de ingresos semana/mes/año, nº pedidos/entregados, producto más vendido y pedidos recientes.

- [ ] **Step 1: Servicio — `src/app/features/dashboard/dashboard.service.ts`**

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { DashboardSummary } from '../../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly api: ApiService) {}

  summary(): Observable<DashboardSummary> {
    return this.api.get<DashboardSummary>('/dashboard/summary');
  }
}
```

- [ ] **Step 2: Test del servicio** (patrón ClientsService: `summary` → `get('/dashboard/summary')`).

- [ ] **Step 3: Componente — `src/app/features/dashboard/dashboard.component.ts`**

```ts
import { Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type DashboardSummary } from '../../models';
import { StatusBadgeComponent } from '../orders/status-badge.component';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <h2 class="mb-4 text-2xl font-bold">Dashboard</h2>
    @if (summary(); as s) {
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="card"><div class="text-sm text-stone-500">Ingresos semana</div><div class="text-2xl font-bold">${{ s.revenueWeek }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Ingresos mes</div><div class="text-2xl font-bold">${{ s.revenueMonth }}</div></div>
        <div class="card"><div class="text-sm text-stone-500">Ingresos año</div><div class="text-2xl font-bold">${{ s.revenueYear }}</div></div>
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
                <td>{{ order.client?.name }}</td>
                <td>${{ order.totalAmount }}</td>
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
```

- [ ] **Step 4: Spec del componente — `src/app/features/dashboard/dashboard.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';

describe('DashboardComponent', () => {
  let service: { summary: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { summary: vi.fn() };
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardService, useValue: service }],
    });
  });

  it('renders the summary cards', () => {
    service.summary.mockReturnValue(
      of({
        revenueWeek: 10, revenueMonth: 20, revenueYear: 30,
        ordersCount: 2, deliveredCount: 1, cancelledCount: 1,
        topProduct: { productId: 1, productName: 'Torta', quantity: 5 },
        recentOrders: [{ id: 1, orderNumber: 'ORD-0001', client: { id: 1, name: 'Ana', phone: '3001' }, totalAmount: 10, status: 'DELIVERED' }],
      }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ingresos semana');
    expect(el.textContent).toContain('Torta');
    expect(el.textContent).toContain('ORD-0001');
  });

  it('renders fallback when there is no top product', () => {
    service.summary.mockReturnValue(
      of({
        revenueWeek: 0, revenueMonth: 0, revenueYear: 0,
        ordersCount: 0, deliveredCount: 0, cancelledCount: 0,
        topProduct: null, recentOrders: [],
      }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin datos');
    expect(fixture.nativeElement.textContent).toContain('Sin pedidos recientes');
  });
});
```

- [ ] **Step 5: Verificar**

Run: `npx ng test --watch=false --coverage`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/dashboard
git commit -m "feat: dashboard feature"
```

---

### Task 9: Workflows, README y verificación final

**Files:**
- Modify: `.github/workflows/coverage.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: CI verde (lint + coverage) y README.

- [ ] **Step 1: Actualizar `.github/workflows/coverage.yml`**

```yaml
      - run: npm ci
      - run: npm run test:cov
```

(Sustituye `npm test -- --coverage` por `npm run test:cov`.)

Verifica que `lint.yml` ya ejecuta `npm run lint` (script añadido en Task 1).

- [ ] **Step 2: Escribir `README.md`**

```markdown
# Respoter — Frontend

Interfaz web de Respoter, una aplicación de repostería para gestionar recetas, productos, clientes y pedidos.

## Stack

- Angular 21 (standalone, control flow `@if`/`@for`)
- Tailwind CSS v4
- Vitest (unit + integración con TestBed)
- ESLint + @angular-eslint

## Requisitos

- Node.js 20+
- El backend corriendo en `http://localhost:3000` (ver README de `resposter-bk`)

## Ejecutar

```bash
npm install
npm start        # http://localhost:4200 (proxy /api -> localhost:3000)
```

## Pruebas

```bash
npm run test:cov   # cobertura >= 95%
npm run lint
```

## Estructura

- `src/app/core/api.service.ts` — cliente HTTP central
- `src/app/models/` — interfaces de dominio
- `src/app/features/` — `dashboard`, `orders`, `recipes`, `products`, `clients`, `ingredients`
- `src/app/shared/photo-upload.component.ts` — subida de fotos
```

- [ ] **Step 3: Verificar todo el proyecto**

Run: `npm run lint`
Expected: sin errores.

Run: `npm run build`
Expected: compila.

Run: `npm run test:cov`
Expected: PASS con cobertura ≥ 95%. Si algún archivo baja del umbral, añade los casos que faltan (render/empty/acciones para componentes; un test por método para servicios).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: workflows, readme and final verification"
```

---

## Self-Review Notes

- Cada feature tiene servicio + lista + formulario con specs (render, empty, acciones, validación, precarga). El dashboard y los componentes compartidos también tienen specs.
- Umbrales de cobertura al 95% están en `angular.json` (test target). Si un archivo no alcanza, Task 9 Step 3 indica el remedio.
- Sin SSR: menos piezas móviles y tests más estables.
