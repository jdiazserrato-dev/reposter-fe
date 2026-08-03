import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, OrderItem, Product } from '../../models';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from './orders.service';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';

type OrderItemForm = FormGroup<{
  productId: FormControl<number | null>;
  productName: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
}>;

interface OrderItemInput {
  productId?: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, PhotoUploadComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-6 text-3xl font-extrabold tracking-tight">{{ id ? 'Editar pedido' : 'Nuevo pedido' }}</h1>
      <form [formGroup]="form" (ngSubmit)="save()" class="sign-panel p-6">
        <div class="mb-5">
          <label class="label" for="client">Cliente</label>
          <select id="client" class="select" formControlName="clientId">
            <option [ngValue]="null">Cliente nuevo</option>
            @for (client of clients(); track client.id) {
              <option [ngValue]="client.id">{{ client.name }}</option>
            }
          </select>
        </div>
        @if (form.value.clientId === null) {
          <div class="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="clientName">Nombre</label>
              <input id="clientName" class="input" formControlName="clientName" placeholder="Nombre del cliente" />
            </div>
            <div>
              <label class="label" for="clientPhone">Teléfono</label>
              <input id="clientPhone" class="input" formControlName="clientPhone" placeholder="Teléfono" />
            </div>
          </div>
        }
        <div class="mb-5">
          <label class="label" for="deliveryDate">Fecha de entrega</label>
          <input id="deliveryDate" class="input" type="date" formControlName="deliveryDate" />
        </div>
        <div class="mb-5">
          <div class="label">Líneas</div>
          <div formArrayName="items">
            @for (item of items.controls; track item; let i = $index) {
              <div class="mb-2 border border-line p-4" [formGroupName]="i">
                <div class="grid grid-cols-4 items-end gap-4">
                  <div class="col-span-2">
                    <label class="label" [for]="'product' + i">Producto</label>
                    <select [id]="'product' + i" class="select" formControlName="productId" (change)="onProduct($event, i)">
                      <option [ngValue]="null">Seleccionar producto</option>
                      @for (product of products(); track product.id) {
                        <option [ngValue]="product.id">{{ product.name }}</option>
                      }
                    </select>
                    @if (item.controls.productName.invalid && item.controls.productId.touched) {
                      <p class="mt-1 text-xs text-[#b3261e]">Selecciona un producto</p>
                    }
                  </div>
                  <div>
                    <label class="label" [for]="'quantity' + i">Cantidad</label>
                    <input [id]="'quantity' + i" class="input" type="number" formControlName="quantity" min="1" />
                  </div>
                  <div>
                    <label class="label" [for]="'price' + i">Precio unitario</label>
                    <input [id]="'price' + i" class="input" type="number" formControlName="unitPrice" min="0" />
                  </div>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-sm text-mute">{{ item.value.productName }}</span>
                  <button type="button" class="btn btn-danger" (click)="removeItem(i)">Eliminar</button>
                </div>
              </div>
            }
          </div>
          <button type="button" class="btn btn-secondary" (click)="addItem()">Añadir línea</button>
        </div>
        <div class="mb-5">
          <label class="label" for="notes">Notas</label>
          <textarea id="notes" class="textarea" formControlName="notes" rows="3" placeholder="Notas del pedido"></textarea>
        </div>
        <app-photo-upload [url]="form.value.photoPath ?? null" [kind]="'orders'" (urlChange)="onPhoto($event)"></app-photo-upload>
        <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span class="text-lg font-extrabold">Total: \${{ total() }}</span>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Guardar pedido</button>
        </div>
      </form>
    </div>
  `,
})
export class OrderFormComponent implements OnInit {
  public readonly clients = signal<Client[]>([]);
  public readonly products = signal<Product[]>([]);
  public readonly form: FormGroup<{
    clientId: FormControl<number | null>;
    clientName: FormControl<string>;
    clientPhone: FormControl<string>;
    deliveryDate: FormControl<string>;
    notes: FormControl<string>;
    photoPath: FormControl<string | null>;
    items: FormArray<OrderItemForm>;
  }>;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);
  protected readonly id = Number(this.route.snapshot.params['id'] ?? 0);

  constructor() {
    this.form = this.fb.nonNullable.group({
      clientId: [null as number | null],
      clientName: [''],
      clientPhone: [''],
      deliveryDate: ['', Validators.required],
      notes: [''],
      photoPath: [null as string | null],
      items: this.fb.array<OrderItemForm>([]),
    });
  }

  get items(): FormArray<OrderItemForm> {
    return this.form.get('items') as FormArray<OrderItemForm>;
  }

  ngOnInit(): void {
    this.clientsService.findAll().subscribe((data) => this.clients.set(data));
    this.productsService.findAll().subscribe((data) => this.products.set(data));
    if (this.id) {
      this.ordersService.findOne(this.id).subscribe((o) => {
        this.form.patchValue({
          clientId: o.clientId ?? null,
          clientName: o.client?.name ?? '',
          clientPhone: o.client?.phone ?? '',
          deliveryDate: o.deliveryDate.slice(0, 10),
          notes: o.notes ?? '',
          photoPath: o.photoPath ?? null,
        });
        o.items.forEach((item) => this.items.push(this.newItem(item)));
      });
    } else {
      this.items.push(this.newItem());
    }
  }

  newItem(item?: OrderItemInput): OrderItemForm {
    return this.fb.nonNullable.group({
      productId: [item?.productId ?? null as number | null],
      productName: [item?.productName ?? '', [Validators.required]],
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

  onProduct(_event: Event, index: number): void {
    const productId = this.items.at(index).get('productId')?.value;
    const product = this.products().find((p) => p.id === productId);
    this.items.at(index).patchValue({
      productName: product?.name ?? '',
      unitPrice: Number(product?.basePrice ?? 0),
    });
  }

  onPhoto(url: string | null): void {
    this.form.patchValue({ photoPath: url });
  }

  total(): number {
    return this.items.controls.reduce((sum, control) => {
      const quantity = Number(control.get('quantity')?.value) || 0;
      const unitPrice = Number(control.get('unitPrice')?.value) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.value;
    if (!value.deliveryDate) {
      return;
    }
    const body: Record<string, unknown> = {
      deliveryDate: new Date(value.deliveryDate).toISOString(),
      notes: value.notes,
      photoPath: value.photoPath,
      items: (value.items as OrderItem[]).map((item) => ({
        productId: item.productId ?? null,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
    if (value.clientId) {
      body['clientId'] = value.clientId;
    } else if (value.clientName && value.clientPhone) {
      body['client'] = { name: value.clientName, phone: value.clientPhone };
    }
    if (this.id) {
       this.ordersService.update(this.id, body).subscribe(() => this.router.navigate(['/pedidos']));
    } else {
       this.ordersService.create(body).subscribe(() => this.router.navigate(['/pedidos']));
    }
  }
}
