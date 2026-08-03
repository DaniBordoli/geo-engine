import { eq } from "drizzle-orm";

// Host normalizado para cachear prompts por dominio: "https://www.nike.com/x" →
// "nike.com". Une re-scans del mismo dominio aunque varíe protocolo/www/path.
export function domainKey(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

// Cache de prompts por dominio (best-effort). Sin DATABASE_URL → no-op, como el
// resto del seam. Nunca tira: un fallo de cache degrada a detección fresca.
export type CachedVertical = { category: string; lang: string; prompts: string[] };

export async function getCachedVertical(key: string): Promise<CachedVertical | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { db } = await import("@/db");
    const { domainPrompts } = await import("@/db/schema");
    const [row] = await db
      .select()
      .from(domainPrompts)
      .where(eq(domainPrompts.domainKey, key));
    if (!row) return null;
    const prompts = row.prompts as string[];
    if (!Array.isArray(prompts) || prompts.length === 0) return null;
    return { category: row.category, lang: row.lang, prompts };
  } catch (err) {
    console.error("getCachedVertical falló (sigo sin cache)", err);
    return null;
  }
}

export async function cacheVertical(key: string, v: CachedVertical): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const { db } = await import("@/db");
    const { domainPrompts } = await import("@/db/schema");
    // onConflictDoNothing: el primer scan del dominio fija el set canónico; los
    // concurrentes/posteriores no lo pisan.
    await db
      .insert(domainPrompts)
      .values({ domainKey: key, category: v.category, lang: v.lang, prompts: v.prompts })
      .onConflictDoNothing();
  } catch (err) {
    console.error("cacheVertical falló (no rompe)", err);
  }
}
