import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { LoggerService } from './logger.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const started = performance.now();
  logger.info('HTTP request', req.method, req.url);

  let status: number | undefined;
  let error: unknown;

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          status = event.status;
        }
      },
      error: (err: unknown) => {
        error = err;
      },
    }),
    finalize(() => {
      const duration = Math.round(performance.now() - started);
      if (error === undefined) {
        logger.info('HTTP response', req.method, req.url, 'status', status, 'duration_ms', duration);
        return;
      }
      logger.error('HTTP error', req.method, req.url, error, 'duration_ms', duration);
    }),
  );
};
