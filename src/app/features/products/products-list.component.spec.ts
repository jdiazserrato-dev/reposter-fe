import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ProductsListComponent } from './products-list.component';
import { ProductsService } from './products.service';

describe('ProductsListComponent', () => {
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = { findAll: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        { provide: ProductsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
  });

  it('renders the product list', () => {
    service.findAll.mockReturnValue(
      of([
        {
          id: 1,
          name: 'Torta',
          category: 'torta',
          basePrice: 20,
          photoPath: '/uploads/a.png',
        },
      ]),
    );
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Torta');
    expect(fixture.nativeElement.textContent).toContain('$20');
  });

  it('shows empty state', () => {
    service.findAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Sin productos registrados.',
    );
  });

  it('removes a product and reloads', () => {
    service.findAll.mockReturnValue(
      of([{ id: 1, name: 'Torta', category: 'torta', basePrice: 20 }]),
    );
    service.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.btn-danger')!
      .click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });
});
