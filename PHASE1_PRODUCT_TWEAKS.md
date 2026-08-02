# Fase 1 — Tweaks de producto (Semana 1) para Claude Code

> Lo que hay que construir antes de lanzar: reporte público compartible + OG image
> del cachetazo + tabla `events` con atribución de fuente + Plausible (detrás de un
> wrapper). Es el mecanismo viral y el medidor para leer la señal.

## Cómo usarlo
Pegale a Claude Code: *"Leé PHASE1_PRODUCT_TWEAKS.md. Implementá bloque por bloque
(T1→T5), mostrame el diff de cada uno y esperá mi OK antes del siguiente. Seguí el
patrón del código existente (persist best-effort, tokens opacos, tests)."*

---

## T1 · Reporte público compartible (el mecanismo viral)
**Archivos:** `db/schema.ts` (+ migración), nueva ruta `app/r/[token]/page.tsx`,
reusar `app/report-view.tsx`
- Agregá `reportToken uuid unique default random` a la tabla `scans` (token propio,
  desacoplado del `id` interno que usa el fix pack).
- Ruta pública `/r/[reportToken]`: renderiza el reporte **read-only**, sin gate de
  email, para cualquiera con el link. Incluí un CTA "escaneá tu tienda" que lleva a
  la landing.
- En el flujo primario (scan propio), mostrá el link `/r/[reportToken]` con un
  botón "compartí tu resultado".
- **Aceptación:** un tercero abre `/r/[token]` y ve el cachetazo sin loguearse; el
  dueño ve su link para compartir.

## T2 · OG image del cachetazo
**Archivos:** `app/r/[token]/opengraph-image.tsx` (+ `twitter-image.tsx`)
- Usá `ImageResponse` de Next para generar la imagen social del reporte: marca,
  **share-of-voice %** grande, "invisible en X%", y el competidor top.
- Que se vea contundente (es lo que la gente pega en X). Nada de PII.
- **Aceptación:** pegar el link de `/r/[token]` en X/Slack muestra la OG con el dato.

## T3 · Tabla `events` con atribución (la verdad del funnel)
**Archivos:** `db/schema.ts` (+ migración), `lib/analytics/events.ts`
- Tabla `events`: `id`, `type` (enum: `scan_started`, `report_viewed`,
  `report_shared`, `checkout_clicked`, `paid`), `scanId` (nullable, FK),
  `source`, `medium`, `campaign`, `referrer` (text, nullable), `createdAt`.
- Helper server-side `track(type, { scanId, attribution })` — insert best-effort
  (que nunca tumbe la request, igual que `persist`).
- **Aceptación:** cada evento del funnel queda registrado con su `scanId`.

## T4 · Captura de UTM + atribución en el scan
**Archivos:** landing (`app/page.tsx` / `scan-flow.tsx`), acción de scan, `scans`
- En la landing, capturá `utm_source/medium/campaign` (de la query) y
  `document.referrer`; pasalos a la acción de scan.
- Guardá esa atribución en la fila `scans` al crearla (columnas nuevas o jsonb).
- Como cada `event` referencia `scanId`, podés unir **conversión → fuente**:
  "de 200 scans de Reddit, 12 pagaron".
- Disparar los `track(...)`:
  - `scan_started` → al iniciar el scan (con la atribución)
  - `report_viewed` → al cargar `/r/[token]`
  - `report_shared` → al click de compartir
  - `checkout_clicked` → en `fixpack-actions` cuando está `locked` y va al checkout
  - `paid` → en el webhook `order_created`
- **Aceptación:** un scan con `?utm_source=reddit` que termina en pago se puede
  atribuir a Reddit por la cadena `scans.source` + `events`.

## T5 · Plausible (tráfico "de dónde vienen") detrás de un wrapper
**Archivos:** `app/layout.tsx`, `lib/analytics/client.ts`, `.env.example`
- Script de Plausible con `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (cookieless → sin banner).
- Wrapper fino `lib/analytics/client.ts` con `analytics(event, props?)` que hoy
  llama a Plausible; mirroreá los eventos clave (`Scan`, `Share`, `CheckoutClick`,
  `Paid`). Cambiar a Umami después = tocar solo este archivo.
- **Aceptación:** el dashboard de Plausible muestra visitas y fuentes; los eventos
  custom aparecen.

---

## Notas
- **Privacidad:** Plausible/Umami son cookieless — no hace falta cookie banner. No
  metas PII (email, dominio del usuario) en props de analytics.
- **Doble medición a propósito:** Plausible = panorama de tráfico/fuentes rápido;
  tabla `events` = funnel real con conversión por canal. Se complementan.
- **No tocar:** idempotencia del fix pack, webhook HMAC, tokens de dashboard,
  retry. Conservar.

## Lo que hace Dani (no Claude Code)
- Crear la cuenta de Plausible y poner el dominio en la env.
- Poner los datos de cobro / deploy. (Claude Code no toca cuentas ni plata.)
