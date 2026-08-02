# Week 1 — Fixes (post-review)

> Lista priorizada para Claude Code. Basada en la revisión del código real.
> Referencias a archivos concretos. Hacé P0 antes de conectar API keys reales.

## Cómo usarlo
Pegale esto a Claude Code: *"Leé WEEK1_FIXES.md. Implementá P0 y P1 primero,
mostrame el diff de cada bloque antes de seguir al siguiente. No toques nada
fuera de lo listado."*

---

## P0 — antes de conectar keys reales

### P0.1 · Modelos de agente: string válido + split de tier
**Archivos:** `lib/agents/anthropic.ts`, `lib/agents/prompt-generator.ts`, `lib/agents/analyzer.ts`
- `AGENT_MODEL = "claude-opus-5"` puede no resolver — verificá el string contra la
  API actual y corregilo.
- Separá en **dos** modelos: `GENERATOR_MODEL` (más fuerte, pocas llamadas) y
  `ANALYZER_MODEL` (rápido/barato tipo Haiku). El analizador corre 1 vez por
  (prompt × engine) — decenas de llamadas por scan; Opus ahí es caro al pedo.
- Cada agente usa su modelo.
- **Aceptación:** una llamada real a cada agente resuelve sin 404; el analizador
  usa el modelo barato.

### P0.2 · Retry/backoff (hoy un 429 tumba todo el scan)
**Archivos:** nuevo `lib/util/retry.ts`, usado en `lib/scan.ts`
- Retry con backoff exponencial + jitter alrededor de `engine.run` y
  `analyzer.analyze`. Respetá `Retry-After` si viene.
- Degradá con gracia: si un job igual falla tras los reintentos, marcalo como
  fallido y **seguí** (reporte parcial), en vez de tirar el scan entero.
- **Aceptación:** un 429/transient simulado → el scan completa; un job que falla
  de forma permanente no voltea el reporte.

---

## P1 — verificar antes de confiar (código sin testear end-to-end)

### P1.1 · Salida estructurada de los agentes
**Archivos:** `lib/agents/prompt-generator.ts`, `lib/agents/analyzer.ts`
- Smoke-test con key real el `output_config: { format: { type: "json_schema" }}`.
- Si el shape no es exacto para `@anthropic-ai/sdk ^0.115`, pasá a **tool forzado**:
  `tools` + `tool_choice: { type: "tool", name }`, y leés el `input` del bloque
  `tool_use` (en vez de parsear un bloque de texto).
- **Aceptación:** el generador devuelve 20–40 prompts estructurados; el analizador
  devuelve JSON válido.

### P1.2 · Campo de citaciones de Perplexity
**Archivo:** `lib/engines/perplexity.ts`
- Logueá la respuesta cruda una vez y confirmá si las fuentes vienen en
  `citations` o en `search_results` (cambió según versión). Normalizá a `citedUrls`.
- **Aceptación:** `citedUrls` se puebla con un scan real de Perplexity.

---

## P2 — costo y latencia

### P2.1 · Conteo de prompts del free tier
**Archivo:** `lib/scan.ts` (`MAX_PROMPTS`)
- Hacelo configurable y bajá el free tier a ~12–15 prompts. ~160 llamadas dentro
  de un server action puede pasarse del timeout de serverless y hace lento el
  "gancho instantáneo".
- **Aceptación:** un scan free completa cómodo bajo el límite de la plataforma.

### P2.2 · Abaratá el analizador
**Archivo:** `lib/agents/analyzer.ts`
- Mención y competidores por substring (como el mock); reservá el LLM para
  posición/sentiment y solo cuando hay mención. O batcheá varias respuestas por
  llamada.
- **Aceptación:** menos llamadas a Claude por scan; los tests siguen verdes.

---

## P3 — housekeeping

### P3.1 · Sacar `files.zip`
- `git rm files.zip` y agregalo al `.gitignore`. No debería estar comiteado.

### P3.2 · `isCited` por host, no por substring
**Archivo:** `lib/agents/analyzer.ts`
- Parseá el host de la URL y comparalo con el token de marca, para no dar falso
  positivo si la URL de un competidor contiene el string de la marca. (MVP: menor.)

---

## No tocar (está bien)
- Arquitectura mock-first, capa de engines + caché, persistencia best-effort,
  tests con rationale, y el `report-view` (el cachetazo). Conservar tal cual.
