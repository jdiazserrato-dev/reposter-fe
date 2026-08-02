import { Routes } from '@angular/router';
import { ProductFormComponent } from './product-form.component';
import { ProductsListComponent } from './products-list.component';

export const productsRoutes: Routes = [
  { path: '', component: ProductsListComponent },
  { path: 'nuevo', component: ProductFormComponent },
  { path: ':id', component: ProductFormComponent },
];
