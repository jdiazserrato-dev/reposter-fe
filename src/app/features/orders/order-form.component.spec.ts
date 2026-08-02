import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { OrderFormComponent } from './order-form.component';
import { OrdersService } from './orders.service';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { ApiService } from '../../core/api.service';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { Client, Order, Product } from '../../models';

describe('OrderFormComponent', () => {
  let component: OrderFormComponent;
  let fixture: ComponentFixture<OrderFormComponent>;
  let route: { snapshot: { params: Record<string, string> } };
  let ordersService: { findOne: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let clientsService: { findAll: ReturnType<typeof vi.fn> };
  let productsService: { findAll: ReturnType<typeof vi.fn> };
  const router = { navigate: vi.fn() };
  const api = { upload: vi.fn() };

  const clients: Client[] = [{ id: 1, name: 'Juan', phone: '555' }];
  const products: Product[] = [
    { id: 1, name: 'Chocolate', category: 'Pastel', basePrice: 150 },
    { id: 2, name: 'Vainilla', category: 'Pastel', basePrice: 200 },
  ];

  const order: Order = {
    id: 5,
    orderNumber: 'P-5',
    clientId: 1,
    client: { id: 1, name: 'Juan', phone: '555' },
    totalAmount: 300,
    deliveryDate: '2026-08-15T00:00:00.000Z',
    status: 'PENDING',
    notes: 'Nota',
    photoPath: null,
    items: [{ productId: 1, productName: 'Chocolate', quantity: 2, unitPrice: 150 }],
  };

  function createFixture(editId?: string): void {
    route.snapshot.params = editId ? { id: editId } : {};
    fixture = TestBed.createComponent(OrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function selectFirstProduct(): void {
    component.items.at(0).patchValue({ productId: 1 });
    component.onProduct({} as Event, 0);
  }

  beforeEach(async () => {
    route = { snapshot: { params: {} } };
    ordersService = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    clientsService = { findAll: vi.fn() };
    productsService = { findAll: vi.fn() };

    ordersService.findOne.mockReturnValue(of(order));
    ordersService.create.mockReturnValue(of({ id: 1 }));
    ordersService.update.mockReturnValue(of({ id: 5 }));
    clientsService.findAll.mockReturnValue(of(clients));
    productsService.findAll.mockReturnValue(of(products));

    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: OrdersService, useValue: ordersService },
        { provide: ClientsService, useValue: clientsService },
        { provide: ProductsService, useValue: productsService },
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('creates the component', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('loads clients and products and adds an empty line in create mode', () => {
    createFixture();
    expect(clientsService.findAll).toHaveBeenCalled();
    expect(productsService.findAll).toHaveBeenCalled();
    expect(component.clients()).toEqual(clients);
    expect(component.products()).toEqual(products);
    expect(component.items.length).toBe(1);
    expect(ordersService.findOne).not.toHaveBeenCalled();
  });

  it('preloads the order in edit mode', () => {
    createFixture('5');
    expect(ordersService.findOne).toHaveBeenCalledWith(5);
    expect(component.items.length).toBe(1);
    expect(component.form.get('deliveryDate')?.value).toBe('2026-08-15');
    expect(component.form.get('clientId')?.value).toBe(1);
  });

  it('onProduct fills name and price from the catalog', () => {
    createFixture();
    component.items.at(0).patchValue({ productId: 1 });
    component.onProduct({} as Event, 0);
    expect(component.items.at(0).get('productName')?.value).toBe('Chocolate');
    expect(component.items.at(0).get('unitPrice')?.value).toBe(150);
  });

  it('onProduct converts a string basePrice to a number', () => {
    createFixture();
    const products = component
      .products()
      .map((p) => (p.id === 2 ? { ...p, basePrice: '200.00' as unknown as number } : p));
    component.products.set(products);
    component.items.at(0).patchValue({ productId: 2 });
    component.onProduct({} as Event, 0);
    expect(component.items.at(0).get('productName')?.value).toBe('Vainilla');
    expect(component.items.at(0).get('unitPrice')?.value).toBe(200);
  });

  it('handles the product change listener', () => {
    createFixture();
    vi.spyOn(component, 'onProduct');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[id="product0"]');
    select.dispatchEvent(new Event('change'));
    expect(component.onProduct).toHaveBeenCalled();
  });

  it('adds and removes lines', () => {
    createFixture();
    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons().find((b) => b.textContent?.includes('Añadir línea'))!.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(component.items.length).toBe(2);
    buttons().find((b) => b.textContent?.includes('Eliminar'))!.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(component.items.length).toBe(1);
  });

  it('onPhoto updates the photo path', () => {
    createFixture();
    const photo = fixture.debugElement.query(By.directive(PhotoUploadComponent));
    photo.componentInstance.urlChange.emit('/uploads/foto.jpg');
    expect(component.form.get('photoPath')?.value).toBe('/uploads/foto.jpg');
  });

  it('saves a new order with an existing client', () => {
    createFixture();
    component.form.patchValue({ clientId: 1, deliveryDate: '2026-08-15' });
    component.items.at(0).patchValue({ quantity: 2, unitPrice: 150 });
    selectFirstProduct();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(ordersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        deliveryDate: expect.any(String),
        items: [{ productId: 1, productName: 'Chocolate', quantity: 2, unitPrice: 150 }],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/orders']);
  });

  it('saves a new order with a new client', () => {
    createFixture();
    component.form.patchValue({ clientId: null, clientName: 'Maria', clientPhone: '666', deliveryDate: '2026-08-15' });
    selectFirstProduct();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const body = ordersService.create.mock.calls[0][0] as Record<string, unknown>;
    expect(body['client']).toEqual({ name: 'Maria', phone: '666' });
    expect(body['clientId']).toBeUndefined();
  });

  it('does not attach a client when name is missing a phone', () => {
    createFixture();
    component.form.patchValue({ clientId: null, clientName: 'Maria', clientPhone: '', deliveryDate: '2026-08-15' });
    selectFirstProduct();
    component.save();
    const body = ordersService.create.mock.calls[0][0] as Record<string, unknown>;
    expect(body['client']).toBeUndefined();
    expect(body['clientId']).toBeUndefined();
  });

  it('does not save when a line has no product', () => {
    createFixture();
    component.form.patchValue({ clientId: 1, deliveryDate: '2026-08-15' });
    component.items.at(0).patchValue({ quantity: 2, unitPrice: 150 });
    component.save();
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('shows the product hint when a line has no product and is touched', () => {
    createFixture();
    component.items.at(0).get('productId')?.markAsTouched();
    fixture.detectChanges();
    const hints = Array.from(
      fixture.nativeElement.querySelectorAll('p') as unknown as HTMLElement[],
    ).map((p: HTMLElement) => p.textContent);
    expect(hints).toContain('Selecciona un producto');
  });

  it('hides the product hint when the line is valid', () => {
    createFixture();
    selectFirstProduct();
    fixture.detectChanges();
    const hints = Array.from(
      fixture.nativeElement.querySelectorAll('p') as unknown as HTMLElement[],
    ).map((p: HTMLElement) => p.textContent);
    expect(hints).not.toContain('Selecciona un producto');
  });

  it('updates an existing order', () => {
    createFixture('5');
    component.form.patchValue({ deliveryDate: '2026-08-20' });
    component.save();
    expect(ordersService.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ deliveryDate: expect.any(String) }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/orders']);
  });

  it('does not save an invalid form', () => {
    createFixture();
    component.save();
    expect(ordersService.create).not.toHaveBeenCalled();
  });
});
