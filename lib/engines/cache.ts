import type { Engine, EngineQuery, EngineResponse } from "./types";

// Caché en memoria por proceso. Suficiente para el MVP (un scan por request);
// se cambia por Redis/DB cuando haya re-scans persistentes.
const store = new Map<string, EngineResponse>();

function key(engineId: string, q: EngineQuery): string {
  return `${engineId}::${q.brand}::${q.prompt}`;
}

// Envuelve un engine con caché read-through.
export function withCache(engine: Engine): Engine {
  return {
    id: engine.id,
    async run(query: EngineQuery): Promise<EngineResponse> {
      const k = key(engine.id, query);
      const hit = store.get(k);
      if (hit) return hit;
      const res = await engine.run(query);
      store.set(k, res);
      return res;
    },
  };
}
