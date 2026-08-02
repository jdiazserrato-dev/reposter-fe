import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';

describe('DashboardComponent', () => {
  let service: { summary: ReturnType<typeof vi.fn> };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    service = { summary: vi.fn() };
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: service },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
  });

  it('renders the summary cards', () => {
    service.summary.mockReturnValue(
      of({
        revenueWeek: 10,
        revenueMonth: 20,
        revenueYear: 30,
        ordersCount: 2,
        deliveredCount: 1,
        cancelledCount: 1,
        topProduct: { productId: 1, productName: 'Torta', quantity: 5 },
        recentOrders: [
          {
            id: 1,
            orderNumber: 'ORD-0001',
            clientId: 1,
            client: { id: 1, name: 'Ana', phone: '3001' },
            totalAmount: 10,
            status: 'DELIVERED',
            deliveryDate: new Date().toISOString(),
            items: [],
          },
        ],
      }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ingresos semana');
    expect(el.textContent).toContain('Torta');
    expect(el.textContent).toContain('ORD-0001');
  });

  it('renders fallback when there is no top product', () => {
    service.summary.mockReturnValue(
      of({
        revenueWeek: 0,
        revenueMonth: 0,
        revenueYear: 0,
        ordersCount: 0,
        deliveredCount: 0,
        cancelledCount: 0,
        topProduct: null,
        recentOrders: [],
      }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin datos');
    expect(fixture.nativeElement.textContent).toContain('Sin pedidos recientes');
  });
});
