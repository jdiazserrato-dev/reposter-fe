import { HttpClient, HttpEventType } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { loggingInterceptor } from './logging.interceptor';

describe('loggingInterceptor', () => {
  type MockFn = (...args: unknown[]) => void;

  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let logger: {
    debug: MockFn;
    info: MockFn;
    warn: MockFn;
    error: MockFn;
  };

  beforeEach(() => {
    logger = {
      debug: vi.fn<MockFn>(),
      info: vi.fn<MockFn>(),
      warn: vi.fn<MockFn>(),
      error: vi.fn<MockFn>(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoggerService, useValue: logger },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('logs method and url on request', () => {
    httpClient.get('/api/things').subscribe();
    expect(logger.info).toHaveBeenCalledWith('HTTP request', 'GET', '/api/things');
    httpMock.expectOne('/api/things').flush({ ok: true });
  });

  it('logs status and duration on success', () => {
    httpClient.get('/api/things').subscribe();
    httpMock.expectOne('/api/things').flush({ ok: true });
    expect(logger.info).toHaveBeenLastCalledWith(
      'HTTP response',
      'GET',
      '/api/things',
      'status',
      200,
      'duration_ms',
      expect.any(Number),
    );
  });

  it('logs error on failed request', () => {
    httpClient.get('/api/things').subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/things')
      .flush({ ok: false }, { status: 500, statusText: 'Server Error' });
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP error',
      'GET',
      '/api/things',
      expect.any(Object),
      'duration_ms',
      expect.any(Number),
    );
  });

  it('ignores non-response events', () => {
    httpClient
      .get('/api/things', { observe: 'events', reportProgress: true })
      .subscribe();
    const req = httpMock.expectOne('/api/things');
    req.event({ type: HttpEventType.DownloadProgress, loaded: 10, total: 100 });
    req.flush({ ok: true });
    expect(logger.info).toHaveBeenCalledWith(
      'HTTP response',
      'GET',
      '/api/things',
      'status',
      200,
      'duration_ms',
      expect.any(Number),
    );
  });
});
