import { Component, inject, type OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientsService } from './clients.service';

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md">
      <h1 class="mb-6 text-3xl font-extrabold tracking-tight">{{ id ? 'Editar cliente' : 'Nuevo cliente' }}</h1>
      <form [formGroup]="form" (ngSubmit)="save()" class="sign-panel p-6">
        <div class="field">
          <label class="label" for="name">Nombre</label>
          <input id="name" class="input" formControlName="name" />
        </div>
        <div class="field">
          <label class="label" for="phone">Teléfono</label>
          <input id="phone" class="input" formControlName="phone" />
        </div>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar cliente</button>
          <a routerLink="/clientes" class="btn btn-secondary">Cancelar</a>
        </div>
      </form>
    </div>
  `,
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\- ]{7,20}$/)]],
  });

  ngOnInit(): void {
    if (this.id) {
      this.service
        .findOne(this.id)
        .subscribe((c) => this.form.patchValue({ name: c.name, phone: c.phone }));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.value;
    const request = this.id
      ? this.service.update(this.id, body)
      : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/clientes']));
  }
}
