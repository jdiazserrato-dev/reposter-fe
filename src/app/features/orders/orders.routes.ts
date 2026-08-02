import { Routes } from '@angular/router';
import { OrdersListComponent } from './orders-list.component';
import { OrderFormComponent } from './order-form.component';

export const ordersRoutes: Routes = [
  { path: '', component: OrdersListComponent },
  { path: 'nuevo', component: OrderFormComponent },
  { path: ':id', component: OrderFormComponent },
];
