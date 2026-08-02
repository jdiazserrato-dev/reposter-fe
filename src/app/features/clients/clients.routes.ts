import { Routes } from '@angular/router';
import { ClientFormComponent } from './client-form.component';
import { ClientsListComponent } from './clients-list.component';

export const clientsRoutes: Routes = [
  { path: '', component: ClientsListComponent },
  { path: 'nuevo', component: ClientFormComponent },
  { path: ':id', component: ClientFormComponent },
];
