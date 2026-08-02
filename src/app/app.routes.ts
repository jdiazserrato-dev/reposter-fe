import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'pedidos',
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ordersRoutes),
  },
  {
    path: 'recetas',
    loadChildren: () =>
      import('./features/recipes/recipes.routes').then((m) => m.recipesRoutes),
  },
  {
    path: 'productos',
    loadChildren: () =>
      import('./features/products/products.routes').then(
        (m) => m.productsRoutes,
      ),
  },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./features/clients/clients.routes').then((m) => m.clientsRoutes),
  },
  {
    path: 'ingredientes',
    loadChildren: () =>
      import('./features/ingredients/ingredients.routes').then(
        (m) => m.ingredientsRoutes,
      ),
  },
];
