# Respoter — Frontend

Interfaz web de Respoter, una aplicación de repostería para gestionar recetas, productos, clientes y pedidos.

## Stack

- Angular 21 (standalone, control flow `@if`/`@for`)
- Tailwind CSS v4
- Vitest (unit + integración con TestBed)
- ESLint + @angular-eslint

## Requisitos

- Node.js 20+
- El backend corriendo en `http://localhost:3000` (ver README de `resposter-bk`)

## Ejecutar

```bash
npm install
npm start        # http://localhost:4200 (proxy /api -> localhost:3000)
```

## Pruebas

```bash
npm run test:cov   # cobertura >= 95%
npm run lint
```

## Estructura

- `src/app/core/api.service.ts` — cliente HTTP central
- `src/app/models/` — interfaces de dominio
- `src/app/features/` — `dashboard`, `orders`, `recipes`, `products`, `clients`, `ingredients`
- `src/app/shared/photo-upload.component.ts` — subida de fotos
