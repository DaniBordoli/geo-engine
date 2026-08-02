# Week 2 — Fixes (post-review)

> Lista priorizada para Claude Code. Basada en la revisión del código real de la
> Semana 2. Hacé P0 antes de conectar keys reales y de cobrar el primer peso.

## Cómo usarlo
Pegale a Claude Code: *"Leé WEEK2_FIXES.md. Implementá P0 primero, mostrame el
diff de cada bloque antes de seguir. No toques nada fuera de lo listado."*

---

## P0 — antes de keys reales / primera venta

### P0.1 · Verificar el string del modelo (arrastrado de Semana 1)
**Archivo:** `lib/agents/anthropic.ts`
- `GENERATOR_MODEL` y `FIXPACK_MODEL = "claude-opus-5"` — si ese string no
  resuelve, tira **404 el generador de prompts y todo el fix pack**.
- Confirmá contra la API actual con una key real; si no resuelve, poné el string
  válido de Opus vigente.
- **Aceptación:** una llamada real al generador y al fix pack resuelve sin 404.

### P0.2 · Fix pack idempotente (hoy: bomba de costo + filas duplicadas)
**Archivos:** `lib/fixpack/generator.ts`, `app/fixpack-actions.ts`
- Hoy `getFixPackAction` llama a `generateFixPack` cada vez sobre un scan pago, y
  `generateFixPack` **siempre** re-genera (~30 llamadas LLM) e inserta una fila
  nueva en `fixpacks`. Recargar / re-tocar "Ya pagué" vuelve a gastar y duplica.
- **Generá una sola vez:** antes de generar, buscá un `fixpacks` existente para el
  `scanId`; si existe, devolvelo. Agregá `getExistingFixPack(scanId)` en el
  read-side y usalo en la acción.
- **Aceptación:** N llamadas sobre un scan pago = 1 sola generación y 1 sola fila
  en `fixpacks`; las siguientes leen la existente.

### P0.3 · Sacar la generación del camino del usuario (timeout post-pago)
**Archivos:** `app/api/billing/webhook/route.ts`, `app/fixpack-actions.ts`,
`app/fixpack-section.tsx`
- La generación (6 gaps × llamadas a Opus, concurrencia 3) tarda decenas de
  segundos dentro de un server action → riesgo de timeout **después** de que el
  tipo pagó.
- **Approach recomendado (junta con P0.2):** disparar `generateFixPack` en el
  webhook `order_created` (post-pago confirmado), idempotente. La acción del
  cliente pasa a **solo leer** el fixpack de la DB.
  - Estados de la acción: `not_paid` → checkout URL · `paid` sin pack aún →
    "generándose, reintentá" · `paid` con pack → devolverlo.
  - El `fixpack-section` hace un poll corto mientras está "generándose".
- **Ojo webhook:** si generás inline en el webhook, Lemon puede cortar por timeout
  y reintentar — por eso la idempotencia de P0.2 es obligatoria. Si querés cero
  riesgo, encolá un job y respondé 200 rápido; para el MVP, generar inline +
  idempotente + `maxDuration` alto alcanza.
- **Aceptación:** el usuario paga, vuelve, y el fix pack aparece sin que un server
  action corra la generación completa en su request.

---

## P1 — UX de cobro

### P1.1 · El popup del checkout se bloquea
**Archivo:** `app/fixpack-section.tsx`
- `window.open(res.checkoutUrl)` corre después de un `await`, fuera del gesto del
  usuario → varios browsers lo bloquean.
- Traé la checkout URL primero y abrí síncrono en el click, o navegá en la misma
  pestaña con `window.location.href`.
- **Aceptación:** el click de "Desbloquear" abre el checkout sin bloqueo.

---

## P2 — limpieza (menores)

### P2.1 · Enum `plan` muerto
**Archivo:** `db/schema.ts`
- El entitlement se movió a `scans.paid`; el enum/columna `plan` en `users` ya no
  se usa. Sacalo (con su migración) o dejá anotado que es legacy.

### P2.2 · Validar el JSON-LD del schema
**Archivo:** `lib/fixpack/schema.ts`
- `generateSchema` (Haiku) puede devolver prosa. Parseá/valida como JSON antes de
  envolver en el fence; si falla, marcá el item como "revisar" en vez de romper.

### P2.3 · Teaser dinámico (opcional)
**Archivo:** `app/fixpack-section.tsx`
- El teaser bloqueado es estático. Usar un prompt perdido real del `report`
  (`lostPrompts[0]`) lo hace más convincente. Nice-to-have.

---

## No tocar (está bien)
- Retry/degradación, analizador determinista + batch, tiering de modelos,
  verificación HMAC del webhook (raw body + timing-safe), token de dashboard
  unguessable, export a Markdown. Conservar.
