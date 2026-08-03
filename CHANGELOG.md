# Changelog

Todas las versiones notables de Reposter se documentan en este archivo.

## [1.0.2] - 2026-08-02

### Añadido

- Botón "Ver" en la lista de recetas con modal flotante que muestra foto, ingredientes, procedimiento y notas.
- Regla de proxy `/uploads` en `proxy.conf.json` para corregir imágenes rotas en desarrollo.

### Corregido

- Lista de pedidos: el dropdown de estado conserva el estado actualmente seleccionado en lugar del placeholder.
- Lista de pedidos: el texto "Pedido N" (sin `#`) y alineado a la izquierda.
- Lista de pedidos: la columna Estado muestra solo el dropdown (sin status badge).
- Lista de pedidos: los pedidos con estado "Entregado" o "Cancelado" inician con el checkbox "Cerrado" marcado y el dropdown deshabilitado; marcar "Cerrado" deshabilita el select y atenúa la fila.
- Dashboard: el contador `inProcess` ahora usa `Math.max(0, ...)` para evitar valores negativos.
- Dashboard: el texto "Pedido N" (sin `#`) y alineado a la izquierda.
- Formulario de pedido: corregido el color `text-danger` → `text-[#b3261e]`.
- App: corregido el texto "estado del pedido".

### Refactor

- Los labels de estado de pedidos se centralizaron en `order-status.ts` (`STATUS_OPTIONS` y `ORDER_STATUSES` en español) y el `StatusBadgeComponent` fue refactorizado para usar estas constantes.

## [1.0.1] - 2026-08-02

### Añadido

- Logs transversales con interceptor HTTP (estilo AOP): `LoggerService` y `LoggingInterceptor` registran método, URL, estado y duración de cada petición HTTP, con niveles de log según entorno.

### Cambiado

- Versión del proyecto actualizada de 0.0.0 a 1.0.1.
