import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'PENDING');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the pending label', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(el.textContent).toContain('Pendiente');
  });

  it('labels every status', () => {
    expect(component.statusLabel('IN_PRODUCTION')).toBe('En producción');
    expect(component.statusLabel('READY_FOR_DELIVERY')).toBe('Listo para entrega');
    expect(component.statusLabel('DELIVERED')).toBe('Entregado');
    expect(component.statusLabel('CANCELLED')).toBe('Cancelado');
  });

  it('returns a color class for every status', () => {
    expect(component.classFor('IN_PRODUCTION')).toContain('bg-sky-100');
    expect(component.classFor('READY_FOR_DELIVERY')).toContain('bg-violet-100');
    expect(component.classFor('DELIVERED')).toContain('bg-emerald-100');
    expect(component.classFor('CANCELLED')).toContain('bg-rose-100');
  });
});
