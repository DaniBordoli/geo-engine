# Week 2 — Cleanup restante

> Lo único que quedó tras verificar los P0/P1 (idempotencia, generación post-pago
> y popup: OK). Dos ítems, ninguno bloqueante.

## Cómo usarlo
Pegale a Claude Code: *"Leé WEEK2_CLEANUP.md. Hacé C1 y C2, mostrame el diff de
cada uno."*

---

### C1 · Confirmar el string del modelo `claude-opus-5`
**Archivo:** `lib/agents/anthropic.ts` (`GENERATOR_MODEL`, `FIXPACK_MODEL`)
- Hacé UNA llamada real con la key a un agente que use `GENERATOR_MODEL` (p. ej.
  el generador de prompts) y confirmá que **no da 404 de modelo inexistente**.
- Si resuelve → dejalo como está.
- Si da 404 → reemplazá `"claude-opus-5"` por el string de Opus válido vigente en
  las dos constantes.
- **Por qué importa:** si el string es inválido, tira 404 el generador de prompts
  y todo el fix pack. Es lo único con riesgo de runtime antes de cobrar.
- **Aceptación:** una corrida real del generador y del fix pack completa sin 404.

---

### C2 · Sacar el enum/columna `plan` (código muerto)
**Archivos:** `db/schema.ts` + nueva migración
- El entitlement se movió a `scans.paid`; `planEnum` y la columna `plan` en
  `users` ya no se usan en ningún lado.
- Quitá la columna `plan` de la tabla `users` y el `planEnum`, y generá la
  migración (`npm run db:generate`).
- Antes de aplicar: `grep -rn "planEnum\|\.plan\b" lib app db` para confirmar que
  no quede ninguna referencia.
- **Aceptación:** typecheck limpio, `npm test` verde, y la migración dropea
  columna + enum sin romper nada.

---

## No tocar
- Idempotencia del fix pack (early-return + unique en `fixpacks.scan_id` +
  `onConflictDoNothing`), generación en `after()` con `maxDuration`, máquina de
  estados de la acción + polling, y el fix del popup. Todo verificado, conservar.
