import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { OrdersListComponent } from './orders-list.component';
import { OrdersService } from './orders.service';
import { Order } from '../../models';

describe('OrdersListComponent', () => {
  let component: OrdersListComponent;
  let fixture: ComponentFixture<OrdersListComponent>;
  let service: { findAll: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };
  const router = { navigate: vi.fn() };

  const orders: Order[] = [
    {
      id: 1,
      orderNumber: 'P-1',
      clientId: 1,
      client: { id: 1, name: 'Juan', phone: '555' },
      totalAmount: 250,
      status: 'PENDING',
      deliveryDate: new Date().toISOString(),
      items: [],
    },
  ];

  beforeEach(async () => {
    service = { findAll: vi.fn(), updateStatus: vi.fn() };
    service.findAll.mockReturnValue(of(orders));
    service.updateStatus.mockReturnValue(of({ ...orders[0], status: 'DELIVERED' }));

    await TestBed.configureTestingModule({
      imports: [OrdersListComponent],
      providers: [
        { provide: OrdersService, useValue: service },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads orders and renders rows', () => {
    expect(component.orders().length).toBe(1);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('P-1');
    expect(el.textContent).toContain('Juan');
    expect(el.textContent).toContain('250');
  });

  it('renders the empty state', () => {
    service.findAll.mockReturnValue(of([]));
    component.ngOnInit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay pedidos registrados.');
  });

  it('onStatus updates the status and refreshes the signal', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'DELIVERED';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'DELIVERED');
    expect(component.orders()[0].status).toBe('DELIVERED');
  });

  it('checkbox toggles the disabled state of the row select', () => {
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

    expect(select.disabled).toBe(false);

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(select.disabled).toBe(true);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(select.disabled).toBe(false);
  });

  it('dimming class is applied when checkbox is checked', () => {
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    const tr: HTMLElement = fixture.nativeElement.querySelector('tbody tr');

    expect(tr.className).toBe('');

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(tr.className).toContain('opacity-50');
  });

  it('renders the dropdown Estado labels in Spanish', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const options = Array.from(select.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options[0].text).toBe('Pendiente');
    expect(options[1].text).toBe('En producción');
    expect(options[2].text).toBe('Listo para entrega');
    expect(options[3].text).toBe('Entregado');
    expect(options[4].text).toBe('Cancelado');
  });

  it('renders Pedido 1 (without #) instead of Puerta', () => {
    expect(fixture.nativeElement.textContent).toContain('Pedido 1');
    expect(fixture.nativeElement.textContent).not.toContain('Pedido #1');
    expect(fixture.nativeElement.textContent).not.toContain('Puerta');
  });

  it('does not render a status badge, only the dropdown', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-status-badge')).toBeNull();
    expect(el.querySelector('select')).not.toBeNull();
  });

  it('dropdown shows the current order status as selected', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('PENDING');
  });

  it('selects the DELIVERED option when marked as selected', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 2,
          orderNumber: 'P-2',
          clientId: 1,
          client: { id: 1, name: 'Ana', phone: '555' },
          totalAmount: 300,
          status: 'DELIVERED',
          deliveryDate: new Date().toISOString(),
          items: [],
        },
      ]),
    );
    component.ngOnInit();
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const options = Array.from(select.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options[3].selected).toBe(true);
  });

  it('checks the checkbox and disables the select for delivered orders', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 2,
          orderNumber: 'P-2',
          clientId: 1,
          client: { id: 1, name: 'Ana', phone: '555' },
          totalAmount: 300,
          status: 'DELIVERED',
          deliveryDate: new Date().toISOString(),
          items: [],
        },
      ]),
    );
    component.ngOnInit();
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

    expect(checkbox.checked).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('checks the checkbox and disables the select for cancelled orders', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 3,
          orderNumber: 'P-3',
          clientId: 1,
          client: { id: 1, name: 'Luis', phone: '555' },
          totalAmount: 150,
          status: 'CANCELLED',
          deliveryDate: new Date().toISOString(),
          items: [],
        },
      ]),
    );
    component.ngOnInit();
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

    expect(checkbox.checked).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('does not check the checkbox for pending orders', () => {
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });
});
