# Kickoff — Claude Code

## Paso 0 — Setup (una vez, en tu terminal)

```bash
# 1. Crear el repo y entrar
mkdir geo-engine && cd geo-engine && git init

# 2. Poner PROPOSAL.md en la raíz del repo (copialo ahí)

# 3. Instalar las skills de diseño (desde la raíz del proyecto)
npx skills add pbakaus/impeccable        # base de gusto (vocabulario + anti-slop)
npx skills add Leonxlnx/taste-skill       # ecualizador de estilo (dials densidad/motion)
npx skills add emilkowalski/skill         # motion polish (correr al final)

# 4. Reiniciar Claude Code y verificar
#    Dentro de la sesión: escribí /skills y confirmá que aparecen las 3
```

> Nota: Impeccable y Taste Skill son las dos "capa base". Arrancá usando UNA como
> base (yo probaría Impeccable primero). Si el diseño sale confuso, desactivá una.
> Emil no compite: es solo animaciones, va al final.

---

## Prompt para pegar en Claude Code (primera sesión)

```
Contexto: vamos a construir el MVP de "geo-engine", un motor agéntico de
Generative Engine Optimization. El spec completo está en PROPOSAL.md en la raíz
del repo. Leelo entero antes de escribir una línea.

Trabajamos spec-driven: primero me proponés el plan de scaffold y esperás mi OK,
después implementás. No implementes de más: quiero un MVP fino, no un framework.

Arranquemos con el SCAFFOLD y la SEMANA 1 (diagnóstico). Concretamente:

1. Scaffold Next.js (App Router) + TypeScript + Tailwind, con la estructura de
   carpetas que define PROPOSAL.md (/app, /lib/verticals, /lib/agents,
   /lib/engines, /lib/scoring, /lib/fixpack, /db, /emails).
2. Definí el tipo `VerticalConfig` tal como está en el spec, y creá un config
   placeholder (id "ecommerce") que después completamos.
3. Implementá el flujo mínimo de la Semana 1:
   - generador de prompts (agente Claude, 20–40 prompts desde category+icp+archetypes)
   - runner de engines con Perplexity + OpenAI (interfaz común, caché, rate limits)
   - analizador de respuesta (mención, citación con URL, posición, sentiment, competidores)
   - scoring (share-of-voice, tasa de citación, leaderboard)
   - una landing con un input de dominio → corre scan → muestra el reporte,
     gateado por email
4. Env vars: dejá un .env.example con las keys necesarias (ANTHROPIC_API_KEY,
   OPENAI_API_KEY, PERPLEXITY_API_KEY, DATABASE_URL). No pongas keys reales.

Antes de codear, tirame:
- el plan de scaffold (qué archivos creás y en qué orden)
- las decisiones abiertas que necesitás que yo cierre

Para la UI, usá las skills de diseño instaladas (base de gusto + Taste como
ecualizador). El motion de Emil Kowalski lo dejamos para el final, cuando la UI
ya esté armada. El reporte de diagnóstico es la pantalla estrella: el share-of-voice
bajo y los competidores ganando tienen que pegar fuerte visualmente.
```

---

## Cómo seguir después del scaffold
- Cuando la Semana 1 funcione (dominio → reporte real), volvé al chat de estrategia
  para cerrar el wedge de lanzamiento y ajustar el config del vertical elegido.
- Recién ahí arrancás la Semana 2 (fix pack + muro de pago).
- Motion pass de Emil: al final, sobre la UI ya construida.
- Regla: validá que alguien paga (aunque sea con fix pack semi-manual) antes de
  automatizar el generador completo.
