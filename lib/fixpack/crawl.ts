// Trae señal de la homepage del cliente para aterrizar el contenido del fix pack
// en datos reales (productos/precios/posicionamiento) en vez de inventarlos.
// Extrae title + meta description + og + JSON-LD (presentes en el shell aun en
// SPAs JS-only) además del texto del body. Best-effort: timeout, "" si falla.
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

    const parts: string[] = [];
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title) parts.push(`Title: ${title}`);
    const desc = metaContent(html, "description") || metaContent(html, "og:description");
    if (desc) parts.push(`Description: ${desc}`);

    // JSON-LD: structured data (Product, Organization, FAQ…) — oro para grounding.
    const ld = [
      ...html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ].map((m) => m[1].trim());
    for (const block of ld.slice(0, 3)) parts.push(`JSON-LD: ${block.slice(0, 1500)}`);

    const body = htmlToText(html);
    if (body) parts.push(`Page text: ${body}`);

    return parts.join("\n\n").slice(0, 5000);
  } catch {
    return "";
  }
}

function firstMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? decode(m[1]).replace(/\s+/g, " ").trim() : "";
}

// <meta name|property="X" content="Y"> (el orden de los atributos varía).
function metaContent(html: string, name: string): string {
  const a = html.match(
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
  );
  if (a) return decode(a[1]).trim();
  const b = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"),
  );
  return b ? decode(b[1]).trim() : "";
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}
