# Diseño: Fix productName vacío al crear un pedido

Fecha: 2026-08-02
Rama: `feature/fix_product_name`

## Problema

Al crear un pedido en `order-form.component.ts`, el backend rechaza el request con
"productName should not be empty".

### Causa raíz

`onProduct` (order-form.component.ts:183) lee `event.target.value` del `<select>` y hace
`Number(...)` para localizar el producto:

```ts
const productId = Number((event.target as HTMLSelectElement).value);
```

Con `[ngValue]="product.id"`, Angular codifica el `value` DOM de cada `<option>` como
`"<idDeOpción>: <valor>"` (p. ej. `"1: 1"`, ver `_buildValueString` en
`SelectControlValueAccessor`). Por lo tanto `Number("1: 1")` produce `NaN`, el producto no se
encuentra y `productName` queda en `''`. El FormControl `productId` sí recibe el número
correcto (Angular lo decodifica en su propio `onChange`), por lo que la UI se ve correcta.

### Bug secundario en la misma línea

`unitPrice: product?.basePrice ?? 0` recibe `basePrice` como **string** (`"150.00"`, columna
`DECIMAL` de MySQL serializada por mysql2). El backend lo rechaza con `@IsNumber()` en
`order-item.dto.ts:25`.

## Alcance

- Solo frontend: `src/app/features/orders/order-form.component.ts` y su spec.
- El backend valida correctamente y no se toca.

## Cambios

### 1. `onProduct`: leer el id del FormControl y normalizar `unitPrice`

```ts
onProduct(_event: Event, index: number): void {
  const productId = this.items.at(index).get('productId')?.value;
  const product = this.products().find((p) => p.id === productId);
  this.items.at(index).patchValue({
    productName: product?.name ?? '',
    unitPrice: Number(product?.basePrice ?? 0),
  });
}
```

Es seguro porque Angular registra el listener `onChange` de `SelectControlValueAccessor`
(decodifica `"1: 1"` → `1`) antes que el listener `(change)` del template; cuando `onProduct`
corre, `productId` ya contiene el número correcto.

### 2. Validación

- `newItem` (order-form.component.ts:169): `productName: [item?.productName ?? '', [Validators.required]]`.
  No se valida `productId` para conservar el caso de producto personalizado
  (`productId` nullable, snapshot `productName`).
- `save()` (order-form.component.ts:204): guard `if (this.form.invalid) return;` además del
  chequeo de `deliveryDate`.

### 3. UX: hint en línea sin producto

Bajo el select de producto, mostrar un mensaje solo si la línea está inválida y el select
fue tocado. `productName` es un control oculto sin binding, por lo que su `touched` nunca se
activa; el estado `touched` lo marca el blur del `<select formControlName="productId">`:

```html
@if (item.controls.productName.invalid && item.controls.productId.touched) {
  <p class="text-xs text-danger">Selecciona un producto</p>
}
```

## Pruebas (`order-form.component.spec.ts`)

1. Actualizar `onProduct`: se setea `productId` en el FormControl y se llama `onProduct` con un
   event arbitrario; verifica `productName === 'Chocolate'` y `unitPrice === 150` (number).
2. Actualizar "saves a new order with an existing client": seleccionar producto y verificar que
   el body envía `productName: 'Chocolate'` y `unitPrice` como número.
3. Nuevo: "does not save when a line has no product" — `form.invalid` → `save()` no llama a `create`.
4. Nuevo: el hint se renderiza cuando `productName` está inválido y `productId` está tocado
   (`markAsTouched`), y no aparece en estado válido.

## Verificación

- `npx ng test --watch=false --coverage`
- `npx ng build`
