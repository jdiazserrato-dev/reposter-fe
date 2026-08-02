# Logs AOP + Versión 1.0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir logging transversal estilo AOP en el frontend Angular 21 mediante un interceptor HTTP funcional respaldado por un `LoggerService` con niveles por entorno, y actualizar la versión del proyecto a 1.0.1 en `package.json`, `package-lock.json` y un nuevo `CHANGELOG.md`.

**Architecture:** Un `LoggerService` (`src/app/core/logger.service.ts`) centraliza el logging con niveles (`debug/info/warn/error`), nivel mínimo según `isDevMode()` (dev → debug, prod → warn) y un sink de consola inyectable para tests. Un interceptor HTTP funcional `loggingInterceptor` actúa como "aspecto": registra método + URL al inicio y, con `finalize`, status + duración en éxito o el error en fallo; nunca loguea cuerpos. Se registra en `app.config.ts` con `provideHttpClient(withInterceptors([loggingInterceptor]))`. La versión pasa a 1.0.1 en `package.json`, `package-lock.json` y `CHANGELOG.md`.

**Tech Stack:** Angular 21 (standalone), TypeScript estricto, RxJS, Vitest + TestBed (runner `@angular/build:unit-test`), ESLint + @angular-eslint.

**Spec:** `docs/superpowers/specs/2026-08-02-logs-aop-version-1.0.1-design.md`

## Global Constraints

- TypeScript estricto. Sin comentarios en el código.
- Cobertura ≥ 95% (statements/branches/functions/lines). `app.config.ts`, `main.ts` y rutas están excluidos del coverage en `angular.json`.
- Tests con Vitest + TestBed, globals de vitest disponibles (`describe`, `it`, `expect`, `vi`) vía `tsconfig.spec.json`.
- Verificación final obligatoria: `npm run lint`, `npm run test:cov` y `npm run build`.
- No commitear archivos ajenos al plan (p.ej. `.github/PULL_REQUEST_TEMPLATE.md` está sin trackear y NO se toca ni se commitea).
- No modificar `README.md`.

---

## File Structure

- Create: `src/app/core/logger.service.ts` — servicio de logging con niveles y filtrado por entorno.
- Create: `src/app/core/logger.service.spec.ts` — tests del servicio.
- Create: `src/app/core/logging.interceptor.ts` — interceptor funcional (aspecto de logging HTTP).
- Create: `src/app/core/logging.interceptor.spec.ts` — tests del interceptor.
- Modify: `src/app/app.config.ts` — registrar el interceptor en `provideHttpClient`.
- Modify: `package.json` — versión 1.0.1.
- Modify: `package-lock.json` — versión 1.0.1 (líneas 3 y 9).
- Create: `CHANGELOG.md` — entrada 1.0.1.

---

### Task 1: LoggerService

**Files:**
- Create: `src/app/core/logger.service.ts`
- Test: `src/app/core/logger.service.spec.ts`

**Interfaces:**
- Consumes: nada (dependencia opcional `ConsoleLike` y `LogLevel` se definen en este mismo archivo).
- Produces:
  - `enum LogLevel { debug = 0, info = 1, warn = 2, error = 3 }`
  - `interface ConsoleLike { debug(...args: unknown[]): void; info(...args: unknown[]): void; warn(...args: unknown[]): void; error(...args: unknown[]): void; }`
  - `class LoggerService` con constructor `constructor(sink: ConsoleLike = console, minLevel: LogLevel = isDevMode() ? LogLevel.debug : LogLevel.warn)` y métodos `debug(message: string, ...data: unknown[]): void`, `info(...)`, `warn(...)`, `error(...)`.

- [ ] **Step 1: Write the failing test**

Create `src/app/core/logger.service.spec.ts`:

```ts
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let sink: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sink = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  it('calls the sink method matching the level', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.error('boom');
    expect(sink.error).toHaveBeenCalled();
  });

  it('prefixes the message with level and timestamp', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.info('hola');
    expect(sink.info).toHaveBeenCalledWith(
      expect.stringMatching(/\[[0-9T:.Z-]+\] \[INFO\] hola/),
    );
  });

  it('forwards extra data alongside the message', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.warn('cuidado', { a: 1 });
    expect(sink.warn).toHaveBeenCalledWith(
      expect.stringMatching(/\[WARN\] cuidado/),
      { a: 1 },
    );
  });

  it('drops messages below the minimum level', () => {
    const logger = new LoggerService(sink, LogLevel.error);
    logger.debug('a');
    logger.info('b');
    logger.warn('c');
    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).not.toHaveBeenCalled();
  });

  it('defaults to debug level so debug logs are emitted', () => {
    const logger = new LoggerService(sink);
    logger.debug('x');
    expect(sink.debug).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false`
Expected: FAIL — error de compilación: no se encuentra `./logger.service` (el módulo no existe).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/core/logger.service.ts`:

```ts
import { Injectable, isDevMode } from '@angular/core';

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

export interface ConsoleLike {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly sink: ConsoleLike;
  private readonly minLevel: LogLevel;

  constructor(
    sink: ConsoleLike = console,
    minLevel: LogLevel = isDevMode() ? LogLevel.debug : LogLevel.warn,
  ) {
    this.sink = sink;
    this.minLevel = minLevel;
  }

  debug(message: string, ...data: unknown[]): void {
    this.write(LogLevel.debug, message, data);
  }

  info(message: string, ...data: unknown[]): void {
    this.write(LogLevel.info, message, data);
  }

  warn(message: string, ...data: unknown[]): void {
    this.write(LogLevel.warn, message, data);
  }

  error(message: string, ...data: unknown[]): void {
    this.write(LogLevel.error, message, data);
  }

  private write(level: LogLevel, message: string, data: unknown[]): void {
    if (level < this.minLevel) {
      return;
    }
    const name = LogLevel[level].toLowerCase();
    const prefix = `[${new Date().toISOString()}] [${name.toUpperCase()}]`;
    const call: unknown[] =
      data.length === 0 ? [`${prefix} ${message}`] : [`${prefix} ${message}`, ...data];
    this.sink[name as keyof ConsoleLike](...call);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --watch=false`
Expected: PASS (5 tests). Nota: los tests corren en modo dev, por lo que `isDevMode()` es true y el test del nivel por defecto (debug) pasa.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/logger.service.ts src/app/core/logger.service.spec.ts
git commit -m "feat: LoggerService con niveles y filtrado por entorno"
```

---

### Task 2: LoggingInterceptor + registro

**Files:**
- Create: `src/app/core/logging.interceptor.ts`
- Test: `src/app/core/logging.interceptor.spec.ts`
- Modify: `src/app/app.config.ts`

**Interfaces:**
- Consumes: `LoggerService` (Task 1) — métodos `info(message, ...data)` y `error(message, ...data)`.
- Produces: `export const loggingInterceptor: HttpInterceptorFn` — registrable con `withInterceptors`.

- [ ] **Step 1: Write the failing test**

Create `src/app/core/logging.interceptor.spec.ts`:

```ts
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
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let logger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false`
Expected: FAIL — error de compilación: no se encuentra `./logging.interceptor` (el módulo no existe).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/core/logging.interceptor.ts`:

```ts
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
```

Modify `src/app/app.config.ts` para registrar el interceptor:

```ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { loggingInterceptor } from './core/logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loggingInterceptor])),
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --watch=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/logging.interceptor.ts src/app/core/logging.interceptor.spec.ts src/app/app.config.ts
git commit -m "feat: interceptor HTTP de logging (AOP) y registro en app.config"
```

---

### Task 3: Versión 1.0.1

**Files:**
- Modify: `package.json:3`
- Modify: `package-lock.json:3,9`
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: nada.
- Produces: proyecto en versión 1.0.1; `CHANGELOG.md` con la entrada.

- [ ] **Step 1: Update `package.json`**

Cambiar la línea 3 de `"version": "0.0.0",` a `"version": "1.0.1",`.

- [ ] **Step 2: Update `package-lock.json`**

Cambiar la línea 3 (`"version": "0.0.0"`) y la línea 9 (bloque raíz `"version": "0.0.0"`) a `"version": "1.0.1"`. No cambiar ninguna otra versión de dependencias.

- [ ] **Step 3: Create `CHANGELOG.md`**

Crear en la raíz `CHANGELOG.md`:

```md
# Changelog

Todas las versiones notables de Reposter se documentan en este archivo.

## [1.0.1] - 2026-08-02

### Añadido

- Logs transversales con interceptor HTTP (estilo AOP): `LoggerService` y `LoggingInterceptor` registran método, URL, estado y duración de cada petición HTTP, con niveles de log según entorno.

### Cambiado

- Versión del proyecto actualizada de 0.0.0 a 1.0.1.
```

- [ ] **Step 4: Verify lint, tests and build**

Run: `npm run lint`
Expected: sin errores.

Run: `npm run test:cov`
Expected: PASS con cobertura ≥ 95% (statements/branches/functions/lines).

Run: `npm run build`
Expected: build production exitoso.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump versión a 1.0.1 y añadir changelog"
```

---

## Self-Review

**Spec coverage:**
- LogService con niveles y filtrado dev/prod → Task 1.
- Interceptor HTTP funcional que loguea método/URL/status/duración sin cuerpos → Task 2 (tests cubren éxito, error y eventos no-response).
- Registro en `app.config.ts` → Task 2, Step 3.
- Tests con cobertura ≥ 95% → Tasks 1 y 2 más verificación en Task 3.
- Versión 1.0.1 en `package.json`, `package-lock.json` y `CHANGELOG.md` (sin README) → Task 3.

**Placeholder scan:** sin TBD/TODO; cada paso tiene código o comandos exactos.

**Type consistency:** `LoggerService`, `LogLevel` y `ConsoleLike` se definen en Task 1 y se consumen en Task 2 con las mismas firmas; `loggingInterceptor` se produce en Task 2 y se usa en `app.config.ts` con `withInterceptors`; niveles del log (`HTTP request`, `HTTP response`, `HTTP error`) y argumentos (método, URL, status, duration_ms) son consistentes entre la implementación y los asserts de tests.
