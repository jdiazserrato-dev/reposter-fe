import { Component, inject, type OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IngredientsService } from './ingredients.service';

@Component({
  selector: 'app-ingredient-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="mb-4 text-2xl font-bold">{{ id ? 'Editar ingrediente' : 'Nuevo ingrediente' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card max-w-md">
      <div class="field">
        <label class="label" for="name">Nombre</label>
        <input id="name" class="input" formControlName="name" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar</button>
        <a routerLink="/ingredientes" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `,
})
export class IngredientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(IngredientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  ngOnInit(): void {
    if (this.id) {
      this.service
        .findOne(this.id)
        .subscribe((i) => this.form.patchValue({ name: i.name }));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.value;
    const request = this.id
      ? this.service.update(this.id, body)
      : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/ingredientes']));
  }
}
