import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { IngredientsListComponent } from './ingredients-list.component';
import { IngredientsService } from './ingredients.service';

describe('IngredientsListComponent', () => {
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = { findAll: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      imports: [IngredientsListComponent],
      providers: [
        { provide: IngredientsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
  });

  it('renders the ingredient list', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Harina' }]));
    const fixture = TestBed.createComponent(IngredientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Harina');
  });

  it('shows empty state', () => {
    service.findAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(IngredientsListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Sin ingredientes registrados.',
    );
  });

  it('removes an ingredient and reloads', () => {
    service.findAll.mockReturnValue(of([{ id: 1, name: 'Harina' }]));
    service.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(IngredientsListComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.btn-danger')!
      .click();
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(service.findAll).toHaveBeenCalledTimes(2);
  });
});
