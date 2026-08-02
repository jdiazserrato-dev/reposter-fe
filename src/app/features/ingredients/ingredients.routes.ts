import { Routes } from '@angular/router';
import { IngredientFormComponent } from './ingredient-form.component';
import { IngredientsListComponent } from './ingredients-list.component';

export const ingredientsRoutes: Routes = [
  { path: '', component: IngredientsListComponent },
  { path: 'nuevo', component: IngredientFormComponent },
  { path: ':id', component: IngredientFormComponent },
];
