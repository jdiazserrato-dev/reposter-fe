import { Component, inject, type OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
        <div class="label">Foto</div>
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
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['', [Validators.required, Validators.maxLength(60)]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    photoPath: [null as string | null],
  });

  ngOnInit(): void {
    if (this.id) {
      this.service.findOne(this.id).subscribe((p) =>
        this.form.patchValue({
          name: p.name,
          category: p.category,
          basePrice: p.basePrice,
          photoPath: p.photoPath ?? null,
        }),
      );
    }
  }

  onPhoto(url: string | null): void {
    this.form.get('photoPath')!.setValue(url);
  }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.value;
    const request = this.id
      ? this.service.update(this.id, body)
      : this.service.create(body);
    request.subscribe(() => this.router.navigate(['/productos']));
  }
}
