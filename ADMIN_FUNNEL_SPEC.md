# Spec — Vista /admin del funnel (para Claude Code)

> Los datos ya se guardan en `events` + `scans` (atribución). Falta la vista para
> leer conversión por canal sin escribir SQL a mano.

## Cómo usarlo
Pegale a Claude Code: *"Leé ADMIN_FUNNEL_SPEC.md e implementalo. Mostrame el diff.
Solo lectura, gateado por token, sin dependencias nuevas."*

---

## Objetivo
Una pantalla privada donde Dani ve, de un vistazo: cuánta gente entra por día, de
qué fuente, y qué fuente **convierte** a pago.

## Acceso (simple y seguro)
- Ruta `app/admin/[key]/page.tsx`. Compará `key` contra `process.env.ADMIN_TOKEN`
  con comparación en tiempo constante (como el webhook); si no matchea → `notFound()`.
- Agregá `ADMIN_TOKEN` a `.env.example`.
- Sin login ni cuentas — es de un solo usuario (Dani).

## Qué muestra (server component, solo lectura)
1. **Scans por día (últimos 30):** count de `events` where `type='scan_started'`
   agrupado por fecha. Un sparkline o tabla simple.
2. **Funnel total (últimos 30):** counts por `type` en orden
   `scan_started → report_viewed → report_shared → checkout_clicked → paid`,
   con el % de conversión entre pasos.
3. **Por fuente (la tabla clave):** por cada `source` (de `scans.source`, `null` =
   "directo"): nº de scans y nº de pagos, y la tasa scan→paid.
   - Scans por fuente: agregado sobre `scans` group by `source`.
   - Pagos por fuente: `events` where `type='paid'` join `scans` on `scanId`,
     group by `scans.source`.
   - Mostrar ordenado por pagos desc. Esta tabla responde "¿Reddit o Product Hunt
     me trae los que pagan?".

## Detalles
- Todo con Drizzle sobre la DB existente; sin libs nuevas.
- Fechas en la tz del server; formato corto (YYYY-MM-DD).
- Si `DATABASE_URL` no está, mostrá un estado vacío en vez de romper.
- **Aceptación:** `/admin/<ADMIN_TOKEN>` muestra scans/día, el funnel con % entre
  pasos, y la tabla scan→paid por fuente; `/admin/loquesea` da 404.

## No tocar
- El resto del funnel/tracking ya está bien. Esto es solo la vista de lectura.
