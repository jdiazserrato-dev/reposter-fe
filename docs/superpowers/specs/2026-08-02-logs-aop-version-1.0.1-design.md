# Diseño — Logs AOP (interceptor) + Versión 1.0.1

**Fecha:** 2026-08-02

**Objetivo:** Añadir logging transversal (estilo AOP) en el frontend Angular 21 mediante un interceptor HTTP, y actualizar la versión del proyecto a 1.0.1 en `package.json`, `package-lock.json` y un nuevo `CHANGELOG.md`.

## Contexto

- Angular 21 standalone, control flow `@if`/`@for`, Tailwind v4, Vitest + TestBed, ESLint.
- Cobertura mínima ≥ 95% (statements/branches/functions/lines) configurada en `angular.json`.
- No existe logging actual (solo `console.error` en `src/main.ts`).
- `package.json` y `package-lock.json` están en `"version": "0.0.0"`.
- No hay carpeta `src/environments` ni `fileReplacements`; se distingue dev/prod con `isDevMode()` de `@angular/core` (true en `ng serve`/dev, false en build production).
- Convenciones: sin comentarios en el código.

## Alcance

1. `LogService` con niveles de log y filtrado por entorno.
2. Interceptor HTTP funcional como "aspecto" para loguear tráfico transversal.
3. Registro del interceptor en `app.config.ts`.
4. Tests unitarios con cobertura ≥ 95%.
5. Bump de versión a 1.0.1 en `package.json`, `package-lock.json` y `CHANGELOG.md`.

Fuera de alcance: logging de métodos internos de negocio (no HTTP), persistencia de logs en backend, cambios en README.

## Diseño

### 1. LogService — `src/app/core/logger.service.ts`

- `enum LogLevel { debug = 0, info = 1, warn = 2, error = 3 }`.
- `LogService`:
  - Recibe como dependencia el sink de consola (por defecto `console`) y un nivel mínimo.
  - Nivel mínimo por defecto: `isDevMode()` → `debug`; en producción → `warn`.
  - Métodos `debug(message, ...data)`, `info(message, ...data)`, `warn(message, ...data)`, `error(message, ...data)`.
  - Cada método filtra por nivel y delega en el sink anteponiendo un prefijo con timestamp y nivel: `[2026-08-02T10:00:00.000Z] [INFO] message`.
  - `@Injectable({ providedIn: 'root' })`.

### 2. Interceptor — `src/app/core/logging.interceptor.ts`

- Interceptor funcional: `export const loggingInterceptor: HttpInterceptorFn = (req, next) => Observable<HttpEvent<unknown>>`.
  - Marca `performance.now()` al inicio.
  - Loguea `info` al iniciar la petición: método HTTP + URL.
  - Con `finalize`: calcula duración y loguea el resultado.
    - En respuesta exitosa: `info` con status y duración.
    - En error: `error` con el error y duración.
  - Nunca loguea cuerpos de request/response ni headers sensibles (solo metadatos).

### 3. Registro — `src/app/app.config.ts`

- Reemplazar `provideHttpClient()` por `provideHttpClient(withInterceptors([loggingInterceptor]))`.

### 4. Tests

- `src/app/core/logger.service.spec.ts`:
  - Filtra por nivel mínimo (debug/info/warn/error).
  - Formatea timestamp + nivel en el mensaje.
  - Usa un sink mockeado para verificar llamadas sin tocar `console` real.
- `src/app/core/logging.interceptor.spec.ts`:
  - Con `TestBed` y `HttpTestingController`, verifica que emite logs en petición exitosa (info) y en error (error), con método/URL/status/duración, y que no loguea cuerpos.

### 5. Versión 1.0.1

- `package.json`: `"version": "1.0.1"`.
- `package-lock.json`: `"version": "1.0.1"` (líneas 3 y 9).
- `CHANGELOG.md` (nuevo): entrada `1.0.1` con fecha (2026-08-02) y resumen:
  - Implementación de logs transversales con interceptor HTTP (LogService + LoggingInterceptor).
  - Bump de versión a 1.0.1.
- No se modifica README.

## Manejo de errores

- Errores de red/HTTP: el interceptor loguea `error` con la información disponible y deja propagar el error sin alterarlo (no intercepta ni modifica la respuesta/error).
- Filtrado por nivel previene ruido en producción y evita exponer datos internos.

## Verificación

- `npm run lint` sin errores.
- `npm run test:cov` con cobertura ≥ 95%.
- `npm run build` sin errores (configuración production).
