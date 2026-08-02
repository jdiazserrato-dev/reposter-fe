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
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'DELIVERED');
    expect(component.orders()[0].status).toBe('DELIVERED');
  });
});
