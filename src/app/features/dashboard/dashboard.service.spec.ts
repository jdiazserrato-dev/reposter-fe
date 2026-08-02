import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const api = { get: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(DashboardService);
  });

  it('summary calls GET /dashboard/summary', () => {
    api.get.mockReturnValue(of({ revenueWeek: 0 }));
    service.summary().subscribe((v) => expect(v).toEqual({ revenueWeek: 0 }));
    expect(api.get).toHaveBeenCalledWith('/dashboard/summary');
  });
});
