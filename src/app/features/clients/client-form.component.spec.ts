import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ClientFormComponent } from './client-form.component';
import { ClientsService } from './clients.service';

describe('ClientFormComponent', () => {
  let service: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let param: string | null = null;
  const route = { snapshot: { paramMap: { get: () => param } } };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientFormComponent],
      providers: [
        { provide: ClientsService, useValue: service },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('creates a client when the form is valid', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.componentInstance.form.setValue({ name: 'Ana', phone: '3001234567' });
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(service.create).toHaveBeenCalledWith({
      name: 'Ana',
      phone: '3001234567',
    });
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.componentInstance.form.setValue({ name: '', phone: 'x' });
    fixture.componentInstance.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('loads the client when editing', () => {
    service.findOne.mockReturnValue(of({ id: 5, name: 'Betty', phone: '3002' }));
    param = '5';
    const fixture = TestBed.createComponent(ClientFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('name')!.value).toBe('Betty');
  });
});
