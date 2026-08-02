import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ClientsListComponent } from './clients-list.component';
import { ClientsService } from './clients.service';

describe('ClientsListComponent', () => {
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = { findAll: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [
        { provide: ClientsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
  });

  it('renders the client list', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Ana', phone: '3001' }]));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('3001');
  });

  it('shows empty state', () => {
    service.findAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin clientes');
  });

  it('removes a client and reloads', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Ana', phone: '3001' }]));
    service.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ClientsListComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.btn-danger')!
      .click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });
});
