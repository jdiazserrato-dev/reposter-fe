## Ticket

<!-- ID del ticket en Jira o herramienta de gestión -->
**Jira / Gestión:** `[PROYECTO-XXX]`

---

## Descripción

<!-- Descripción clara y concisa de los cambios implementados -->

**¿Qué se implementó?**

**¿Por qué se necesita?**

**¿Cómo se soluciona?**

---

## Pruebas

- [ ] **Unitarias:** `mvn test`
- [ ] **Integración:** `mvn verify -Pintegration-tests`
- [ ] **Beta:** Desplegado y verificado en ambiente beta
- [ ] **Local:** Probado en entorno local (`mvn spring-boot:run`)

---

## Impacto y Monitoreo

**Métricas afectadas:**
<!-- Ej: latencia, throughput, tasa de error, consumo de CPU/memoria -->

**Logs clave para validación:**
<!-- Archivos de log o queries de observabilidad para monitorear el cambio -->

---

## Plan de Despliegue

- [ ] **Por partes (feature flag)**
- [ ] **Blue/Green**
- [ ] **Canary**
- [ ] **Rolling update**

**Detalle del plan:**

---

## Evidencias

<!-- Capturas de pantalla, logs, o resultados de pruebas que demuestren que el cambio funciona correctamente -->

| Escenario | Resultado | Evidencia |
|-----------|-----------|-----------|
| Test unitarios | ✅ / ❌ | <!-- imagen o log --> |
| Test integración | ✅ / ❌ | <!-- imagen o log --> |
| Prueba en beta | ✅ / ❌ | <!-- imagen o log --> |
