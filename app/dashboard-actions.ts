"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { runScan } from "@/lib/scan";

// Re-corre un scan para el mismo dominio (nuevo scan linkeado por user+domain).
// El usuario se identifica por su token de dashboard.
export async function reScanAction(
  token: string,
  domain: string,
): Promise<{ ok: boolean; error?: string }> {
  const [user] = await db.select().from(users).where(eq(users.dashboardToken, token));
  if (!user) return { ok: false, error: "Usuario no encontrado." };

  try {
    await runScan({ domain, email: user.email });
    revalidatePath(`/dashboard/${token}`);
    return { ok: true };
  } catch (err) {
    console.error("re-scan falló", err);
    return { ok: false, error: "El re-scan falló. Reintentá." };
  }
}
