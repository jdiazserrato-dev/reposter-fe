import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { App } from './app';

@Component({ selector: 'app-stub', template: '' })
class StubComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'dashboard', component: StubComponent },
          { path: 'pedidos', component: StubComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Dulce Encanto brand and nav links', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dulce Encanto');
    expect(el.querySelectorAll('a.gate-link').length).toBe(6);
  });

  it('updates the destination band on navigation', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance as unknown as {
      destination: () => string;
    };

    expect(app.destination()).toBe('Panel');

    await router.navigate(['/pedidos']);
    fixture.detectChanges();
    expect(app.destination()).toBe('Pedidos');
  });
});
