# Proposal: GEO Engine — Semana 2 (ejecución + cobro)

> El diagnóstico es el gancho gratis. **El fix pack es lo que se cobra** y el
> diferencial contra Semrush (ellos miden, nosotros ejecutamos). Semana 2 = generar
> el fix pack, ponerle muro de pago, y trackear re-scans.

---

## Why
La Semana 1 dejó el diagnóstico funcionando (dominio → reporte). Eso valida el
problema y captura el lead, pero no factura. La Semana 2 construye la capa de
ingreso: convertir cada gap detectado en un arreglo accionable, cobrarlo, y
demostrar resultado en el tiempo (retención).

## What Changes
1. **Generador de fix pack**: por cada prompt perdido (o ganado por un competidor),
   mapea gap → causa y genera el arreglo real — contenido citable, schema markup,
   o acción off-site — priorizado por impacto/esfuerzo.
2. **Muro de pago**: free = diagnóstico (ya está); pago = fix pack + re-scans.
3. **Re-scan / tracking**: re-correr un dominio y mostrar la tendencia de citación
   en el tiempo (prueba de resultado + gancho de retención).

## Non-Goals (Semana 2)
- No auto-publica cambios en el sitio del cliente (entrega drafts / export Markdown / PR).
- No teams / multi-seat.
- No automatiza el off-site (genera la lista de acciones; el humano ejecuta).

## Se apoya en lo que YA existe
- `lib/fixpack/types.ts` — contrato `FixItem` / `FixPack` ya definido. Usarlo.
- `db/schema.ts` — tabla `fixpacks` (scanId, items jsonb) y enum `plan` (free/paid)
  en `users`. Ya están.
- El scan ya persiste `scans` / `prompts` / `results` y devuelve `scanId`. Ese es
  el **input del generador**: los prompts perdidos y los competidores ya se conocen.

## Architecture (dónde se enchufa)
```
/lib/fixpack
  generator.ts        # orquesta: input scanId → FixPack
  gap-cause.ts        # agente: por cada gap, diagnostica la causa
  content.ts          # sub-generador: draft citable (usa vertical.contentTemplates)
  schema.ts           # sub-generador: JSON-LD (FAQPage, Product, etc.)
  offsite.ts          # sub-generador: lista priorizada de acciones off-site
  prioritize.ts       # score impacto/esfuerzo → FixItem.priority
/lib/billing
  checkout.ts         # Stripe o Lemon Squeezy
  webhook.ts          # marca users.plan = 'paid'
/app
  report-view.tsx     # + sección fix pack: bloqueada (free) / desplegada (paid)
  /api/billing/webhook
  /dashboard          # historial de scans + tendencia de citación
```

## Tasks — Semana 2

**Generador de fix pack (el valor):**
- [ ] `gap-cause.ts`: por cada prompt perdido / ganado por competidor, un agente
      diagnostica la causa (sin contenido del tema / ausente en fuentes que el LLM
      lee / falta schema / entidad débil), mirando qué tienen los que ganan
      (usar las `citedUrls` de los competidores del scan persistido).
- [ ] `content.ts`: draft citable por gap (claims claros, Q&A, tabla comparativa),
      según `vertical.contentTemplates`.
- [ ] `schema.ts`: JSON-LD relevante al gap.
- [ ] `offsite.ts`: lista priorizada de dónde conseguir menciones (hilos de Reddit,
      sitios de comparación, directorios). Sin automatización.
- [ ] `prioritize.ts`: score impacto/esfuerzo → `FixItem.priority`, ordenado desc.
- [ ] `generator.ts`: orquesta todo, persiste en `fixpacks`, expone export Markdown.
- [ ] Reusar el approach de salida estructurada ya corregido en WEEK1_FIXES (P1.1).

**Muro de pago:**
- [ ] Integrar checkout (Stripe o Lemon Squeezy — ver decisión abierta).
- [ ] Webhook → `users.plan = 'paid'`.
- [ ] Gatear el server action que genera el fix pack detrás del check de plan.
- [ ] Free ve un **preview bloqueado** con 1 `FixItem` de muestra desplegado (teaser).
- [ ] **Concierge flag**: un modo interno para entregar un fix pack hecho a mano a
      los primeros clientes mientras el generador madura (validar que pagan antes de
      automatizar todo).

**Re-scan / tracking:**
- [ ] Re-correr un scan para el mismo dominio, linkeado al scan previo.
- [ ] Vista de tendencia: tasa de citación y share-of-voice en el tiempo.
- [ ] `/dashboard`: historial de scans por usuario (por email).

**Diseño:**
- [ ] Pasada de motion de **Emil Kowalski** ahora que hay superficies nuevas
      (desbloqueo del paywall, gráfico de tendencia). transform/opacity, 140–220ms,
      `prefers-reduced-motion`. Se corre al final, sobre la UI ya armada.

## Reglas de oro (recordatorio)
- **Concierge primero**: vendé el fix pack (aunque sea semi-manual) antes de
  automatizarlo del todo.
- **Honestidad**: vendés *proceso* y *tendencia*, no posiciones garantizadas.

## Decisiones abiertas (para Dani)
1. **Modelo de precio**: pago único por fix pack (menos fricción para la primera
   venta) vs suscripción mensual (recurring + re-scans, mejor negocio a largo plazo).
2. **Stripe vs Lemon Squeezy**: Lemon/Paddle son *merchant of record* — te manejan
   impuestos/VAT globales, ideal para vender en dólares desde Argentina sin lidiar
   con tax. Stripe = más control y fees más bajos, pero el tax lo manejás vos.
   Para tu objetivo (dólares, poco overhead), un merchant-of-record suele ganar.
   *(Nota operativa: la cuenta y las keys de cobro las creás vos; el código las
   consume, no las inventa.)*
