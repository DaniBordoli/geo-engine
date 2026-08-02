// Trae el texto de la homepage del cliente para aterrizar el contenido del fix
// pack en datos reales (productos/precios/posicionamiento) en vez de inventarlos.
// Best-effort: timeout corto, devuelve "" si falla (sitio caído, JS-only, bloqueo).
export async function fetchSiteText(domain: string): Promise<string> {
  const url = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "geo-engine-bot/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    return htmlToText(html).slice(0, 4000);
  } catch {
    return "";
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
