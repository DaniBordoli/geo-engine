// URL pública base de la app (Vercel la expone sola en prod). "" si no se conoce.
export function appBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return v ? `https://${v}` : "";
}
