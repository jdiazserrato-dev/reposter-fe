import { Routes } from '@angular/router';
import { RecipeFormComponent } from './recipe-form.component';
import { RecipesListComponent } from './recipes-list.component';

export const recipesRoutes: Routes = [
  { path: '', component: RecipesListComponent },
  { path: 'nuevo', component: RecipeFormComponent },
  { path: ':id', component: RecipeFormComponent },
];
