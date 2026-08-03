# Order Form productName Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix order creation failing with "productName should not be empty" by making `onProduct` read the product id from the form control (instead of the `[ngValue]`-encoded DOM value), normalize `unitPrice` to a number, and adding validation so empty product lines can't be submitted.

**Architecture:** Two small, independent, TDD tasks on the same component. Task 1 fixes the data source (`onProduct`). Task 2 adds validation + hint. Both touch only `order-form.component.ts` and its spec.

**Tech Stack:** Angular 21 (Reactive Forms, `@for`), Vitest via `@angular/build:unit-test`, Tailwind v4, ESLint. Backend is NestJS (not touched; DTO validation `whitelist + transform + IsNotEmpty` is correct).

## Global Constraints

- Coverage thresholds (angular.json): statements/branches/functions/lines ≥ 95%.
- `noUnusedParameters` (tsconfig) → unused handler arg must be prefixed `_event`.
- Tailwind arbitrary values supported: `text-[#b3261e]` (matches `.btn-danger` color).
- Tests run headless; jsdom simulates DOM value. Single-file run:
  `npx ng test --watch=false --include 'src/app/features/orders/order-form.component.spec.ts'`
- Lint: `npx ng lint` (patterns `src/**/*.ts`, `src/**/*.html`).

---

### Task 1: Fix `onProduct` to read the id from the form control and normalize `unitPrice`

`onProduct` currently does `Number((event.target as HTMLSelectElement).value)`. With `[ngValue]`, Angular encodes the option DOM value as `"<n>: <value>"` (e.g. `"1: 1"`), so `Number("1: 1")` = `NaN`, the product isn't found and `productName` stays `''`. The form-control `productId`, however, holds the correctly decoded number.

**Files:**
- Modify: `reposter-fe/src/app/features/orders/order-form.component.ts:183-190`
- Test: `reposter-fe/src/app/features/orders/order-form.component.spec.ts`

**Interfaces:**
- `OrderFormComponent.products()` → `Product[]` (each `{id:number; name:string; basePrice:number|'150.00'}`).
- `OrderFormComponent.items` FormArray of `OrderItemForm` (FormGroup: productId, productName, quantity, unitPrice).

- [ ] **Step 1: Write the failing tests**

Replace the existing `onProduct` test (spec:97-102) with a control-based version, and add a string-`basePrice` regression test. Add a `selectFirstProduct` helper used by later tasks.

```ts
function selectFirstProduct(): void {
  component.items.at(0).patchValue({ productId: 1 });
  component.onProduct({} as Event, 0);
}

it('onProduct fills name and price from the catalog', () => {
  createFixture();
  component.items.at(0).patchValue({ productId: 1 });
  component.onProduct({} as Event, 0);
  expect(component.items.at(0).get('productName')?.value).toBe('Chocolate');
  expect(component.items.at(0).get('unitPrice')?.value).toBe(150);
});

it('onProduct converts a string basePrice to a number', () => {
  createFixture();
  const products = component
    .products()
    .map((p) => (p.id === 2 ? { ...p, basePrice: '200.00' as unknown as number } : p));
  component.products.set(products);
  component.items.at(0).patchValue({ productId: 2 });
  component.onProduct({} as Event, 0);
  expect(component.items.at(0).get('productName')?.value).toBe('Vainilla');
  expect(component.items.at(0).get('unitPrice')?.value).toBe(200);
});
```

Run: `npx ng test --watch=false --include 'src/app/features/orders/order-form.component.spec.ts' --filter 'onProduct'`
Expected: FAIL — current `onProduct` does `(event.target as HTMLSelectElement).value` on `{} as Event` → `TypeError`; and `product?.basePrice` stays a string.

- [ ] **Step 2: Implement the minimal fix**

`order-form.component.ts` `onProduct`:

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

Run: `npx ng test --watch=false --include 'src/app/features/orders/order-form.component.spec.ts' --filter 'onProduct'`
Expected: PASS (both `onProduct` tests).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/orders/order-form.component.ts src/app/features/orders/order-form.component.spec.ts
git commit -m "fix(orders): fill productName from product catalog via form control"
```

---

### Task 2: Validate that each item has a product (disable/guard) + show hint

Without validation, the form lets the user submit a line with no product; the backend then rejects it. Add `Validators.required` on `productName` (nullable `productId` stays allowed for the custom-product case), a `form.invalid` guard in `save()`, and a touched hint.

**Files:**
- Modify: `reposter-fe/src/app/features/orders/order-form.component.ts:169` (newItem), `:204` (save), `:71-77` (template hint)
- Test: `reposter-fe/src/app/features/orders/order-form.component.spec.ts`

- [ ] **Step 1: Update affected save tests + add validation/hint tests**

Update `"saves a new order with an existing client"` (spec:130) to select a product and assert the body now carries `productName: 'Chocolate'` and numeric `unitPrice`:

```ts
it('saves a new order with an existing client', () => {
  createFixture();
  component.form.patchValue({ clientId: 1, deliveryDate: '2026-08-15' });
  component.items.at(0).patchValue({ quantity: 2, unitPrice: 150 });
  selectFirstProduct();
  fixture.detectChanges();
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
  expect(ordersService.create).toHaveBeenCalledWith(
    expect.objectContaining({
      clientId: 1,
      deliveryDate: expect.any(String),
      items: [{ productId: 1, productName: 'Chocolate', quantity: 2, unitPrice: 150 }],
    }),
  );
  expect(router.navigate).toHaveBeenCalledWith(['/orders']);
});
```

Update `"saves a new order with a new client"` (spec:146) and `"does not attach a client when name is missing a phone"` (spec:156) to call `selectFirstProduct()` (no assertion change on the body shape, just make the form valid).

Add new tests:

```ts
it('does not save when a line has no product', () => {
  createFixture();
  component.form.patchValue({ clientId: 1, deliveryDate: '2026-08-15' });
  component.items.at(0).patchValue({ quantity: 2, unitPrice: 150 });
  component.save();
  expect(ordersService.create).not.toHaveBeenCalled();
});

it('shows the product hint when a line has no product and is touched', () => {
  createFixture();
  component.items.at(0).get('productId')?.markAsTouched();
  fixture.detectChanges();
  const hints = Array.from(fixture.nativeElement.querySelectorAll('p')).map(
    (p: HTMLElement) => p.textContent,
  );
  expect(hints).toContain('Selecciona un producto');
});

it('hides the product hint when the line is valid', () => {
  createFixture();
  selectFirstProduct();
  fixture.detectChanges();
  const hints = Array.from(fixture.nativeElement.querySelectorAll('p')).map(
    (p: HTMLElement) => p.textContent,
  );
  expect(hints).not.toContain('Selecciona un producto');
});
```

Run: `npx ng test --watch=false --include 'src/app/features/orders/order-form.component.spec.ts'`
Expected: FAIL — `"does not save when a line has no product"` calls `create` (no guard yet); hint tests find no `<p>`.

- [ ] **Step 2: Implement validation, guard and hint**

`newItem` (line 169) — add `Validators.required` to `productName`:

```ts
productName: [item?.productName ?? '', [Validators.required]],
```

`save` (line 204) — add guard before reading value:

```ts
save(): void {
  if (this.form.invalid) {
    return;
  }
  const value = this.form.value;
  if (!value.deliveryDate) {
    return;
  }
  ...
}
```

Template (after the product `<select>`):

```html
@if (item.controls.productName.invalid && item.controls.productId.touched) {
  <p class="mt-1 text-xs text-[#b3261e]">Selecciona un producto</p>
}
```

Run: `npx ng test --watch=false --include 'src/app/features/orders/order-form.component.spec.ts'`
Expected: PASS (all order-form tests).

- [ ] **Step 3: Verify lint + build + coverage**

```bash
npx ng lint
npx ng build --configuration production
```
Coverage stays ≥ 95% for `order-form.component.ts`; `text-[#b3261e]` and `_event` are lint-valid.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/orders/order-form.component.ts src/app/features/orders/order-form.component.spec.ts
git commit -m "feat(orders): validate product line and surface empty-name hint"
```
