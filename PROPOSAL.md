# Proposal: GEO Engine (working name)

> Motor agéntico de Generative Engine Optimization. Diagnostica la visibilidad
> de una marca en respuestas de IA (ChatGPT / Perplexity / Gemini / Claude) y
> **ejecuta** los fixes para ganar citaciones. Vertical-agnóstico: un solo motor,
> config por vertical, lanzamiento secuencial.

---

## Why

Las herramientas grandes de SEO (Semrush, Ahrefs) ya resolvieron la capa de
**medición** de visibilidad en IA — es commodity. Lo que ninguna hace bien es la
**ejecución**: te dicen que sos invisible, pero no arreglan el problema. Ahí está
el hueco y el valor cobrable.

El mercado está en hipercrecimiento temprano y hay ~90 competidores, casi todos
horizontales y enfocados en dashboards. El diferencial es doble:
1. **Ejecución agéntica** (generar el contenido/estructura que gana citaciones),
   no solo reportes.
2. **Foco vertical** para no competir de frente y poder ser #1 de un nicho.

## What Changes

Construimos un motor único con estas capas:
- **Diagnóstico** (gratis, el gancho): scan de un dominio → reporte de share-of-voice
  en IA vs competidores.
- **Ejecución** (pago, el negocio): fix pack accionable — contenido citable,
  schema, acciones off-site — priorizado por impacto/esfuerzo.
- **Config de vertical**: un schema que define categoría, prompts semilla, ICP,
  plantillas de contenido y canal. **Un config = un wedge.** Esto habilita lanzar
  e-commerce, LatAm-español y SaaS global sin reescribir el core.

## Non-Goals (MVP)

- No es un dashboard standalone (eso ya existe y no se cobra).
- No garantiza posiciones en respuestas de IA (los engines son volátiles; se
  vende *proceso* y *tendencia*, no garantías).
- No auto-publica cambios en el sitio del cliente en el MVP (entrega drafts / PRs).
- No multi-tenant/teams todavía. Un usuario, un dominio, varios scans.

## Architecture

**Stack:** Next.js (App Router) + TypeScript · Node runtime · Postgres (Neon/Supabase)
· agentes con Claude (Anthropic API) · APIs de engines (OpenAI, Perplexity, Gemini,
Anthropic) · Stripe o Lemon Squeezy para cobros.

```
/app                # Next.js App Router (landing + /scan + /report + /dashboard)
/lib
  /verticals        # config-driven: un archivo por wedge (ecommerce, latam, saas)
  /agents           # generador de prompts, analizador, generador de fix pack
  /engines          # clientes de cada engine + normalización de respuesta + caché
  /scoring          # share-of-voice, tasa de citación, sentiment, leaderboard
  /fixpack          # gap→causa, generador de contenido citable, schema, off-site
/db                 # schema + migraciones (scans, prompts, results, users)
/emails             # captura de lead + reportes
```

**Config de vertical (contrato):**
```ts
type VerticalConfig = {
  id: string;                 // "ecommerce" | "latam" | "saas"
  lang: "en" | "es";
  category: string;           // descriptor de categoría para el generador de prompts
  icp: string;                // descriptor del comprador
  promptArchetypes: string[]; // plantillas: "mejor {X} para {caso}", "{marca} vs {competidor}"
  contentTemplates: string[]; // formatos del fix pack por vertical
  distribution: string;       // canal (Shopify App Store, comunidad LatAm, Semrush App Center)
};
```

## Data model (mínimo)
- `users` (email, plan)
- `scans` (user_id, domain, competitors[], vertical_id, created_at, status)
- `prompts` (scan_id, text, archetype)
- `results` (prompt_id, engine, mentioned, cited, position, sentiment, cited_urls[])
- `fixpacks` (scan_id, items jsonb, generated_at)

---

## Tasks — Semana 1: Diagnóstico (el gancho gratis)

**Objetivo:** pegás un dominio → sale un reporte real de visibilidad en IA.

- [ ] Scaffold Next.js + TS + Postgres + estructura de carpetas de arriba.
- [ ] `VerticalConfig` schema + 1 config de arranque (placeholder, se llena al lockear wedge).
- [ ] **Generador de prompts**: agente que produce 20–40 prompts de intención de
      compra a partir de `category` + `icp` + `promptArchetypes`.
- [ ] **Runner de engines**: empezar con 2 (Perplexity + OpenAI), con caché y manejo
      de rate limits. Interfaz común para sumar Gemini/Anthropic después.
- [ ] **Analizador de respuesta**: detecta mención, citación (con URL fuente),
      posición, sentiment, y competidores presentes.
- [ ] **Scoring**: share-of-voice %, tasa de citación, "invisible en X% de prompts",
      leaderboard de competidores.
- [ ] **Página de reporte** (este es el dashboard) + **landing** con un input
      (dominio) → corre scan → muestra reporte, gateado por email.

**Entregable:** dominio in → reporte real out. Demo-able y compartible.

## Tasks — Semana 2: Ejecución (lo que se cobra)

**Objetivo:** convertir el diagnóstico en un fix pack que Semrush no da.

- [ ] **Mapeo gap → causa**: por cada prompt perdido, el agente determina el porqué
      (sin contenido, ausente en fuentes que el LLM lee, falta schema, entidad débil)
      y analiza qué tienen los que ganan.
- [ ] **Generador de fix pack** (core del valor): por gap priorizado produce un draft
      de contenido *citable* (claims claros, Q&A, tablas comparativas) + schema markup
      + lista de acciones off-site (Reddit, sitios de comparación, directorios).
- [ ] **Entrega**: export Markdown / listo para PR.
- [ ] **Muro de pago**: free = diagnóstico; pago = fix pack + re-scans. Stripe/Lemon.
- [ ] **Re-scan / tracking**: histórico de scans para mostrar cómo sube la citación.

**Entregable:** scan gratis → fix pack pago, end-to-end, con muro de pago. MVP vendible.

## Reglas de oro
- **Concierge fallback**: si el fix pack automático no está fino, entregalo
  semi-manual a los primeros clientes mientras mejorás el agente. Validá que
  pagan *antes* de automatizar todo.
- **Honestidad técnica**: consultar por API ≠ lo que ve el usuario en la app
  (personalización, browsing en vivo). Usar modos con grounding de búsqueda y ser
  transparente: muestra representativa, no garantía. Por eso importan los re-scans.

## Design direction
- **Capa base (elegir UNA):** Impeccable (`pbakaus/impeccable`) **o** Taste Skill
  (`Leonxlnx/taste-skill`). No encimar las dos como base.
- **Motion:** Emil Kowalski (`emilkowalski/skill`) al final — transform/opacity,
  140–220ms, `prefers-reduced-motion`.
- El reporte de diagnóstico es la carta de presentación: el "cachetazo de realidad"
  (share-of-voice bajo, competidores ganando) tiene que verse claro y contundente.

## Secuencia de lanzamiento (decidir al final de la semana 2)
1. **E-commerce (Shopify)** — distribución vía App Store, resuelve el go-to-market.
2. **LatAm-español** — greenfield, ventaja de idioma, dueño de nicho.
3. **SaaS global (EN)** — última, cuando haya producto probado y nombre.
