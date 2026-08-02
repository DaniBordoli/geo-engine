// Trae señal de la homepage del cliente para aterrizar el contenido del fix pack
// en datos reales (productos/precios/posicionamiento) en vez de inventarlos.
// Extrae title + meta description + og + JSON-LD (presentes en el shell aun en
// SPAs JS-only) además del texto del body. Best-effort: timeout, "" si falla.
//
// Fallback headless (detrás de ENABLE_HEADLESS_CRAWL): para shells 100% vacíos
// (SPAs sin meta ni JSON-LD), renderiza con chromium para leer el DOM ya montado.
export async function fetchSiteText(domain: string): Promise<string> {
  const url = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;

  let result = "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "geo-engine-bot/1.0" },
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = await res.text();
      const parts: string[] = [];
      const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
      if (title) parts.push(`Title: ${title}`);
      const desc = metaContent(html, "description") || metaContent(html, "og:description");
      if (desc) parts.push(`Description: ${desc}`);
      const ld = [
        ...html.matchAll(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
        ),
      ].map((m) => m[1].trim());
      for (const block of ld.slice(0, 3)) parts.push(`JSON-LD: ${block.slice(0, 1500)}`);
      const body = htmlToText(html);
      if (body) parts.push(`Page text: ${body}`);
      result = parts.join("\n\n").slice(0, 5000);
    }
  } catch {
    result = "";
  }

  // Shell pobre (SPA vacío) + headless habilitado → renderizar el DOM montado.
  const THIN = 300;
  if (result.length < THIN && process.env.ENABLE_HEADLESS_CRAWL) {
    const rendered = await renderWithBrowser(url);
    if (rendered.length > result.length) {
      return `${result ? result + "\n\n" : ""}Rendered page text: ${rendered}`.slice(0, 5000);
    }
  }
  return result;
}

// Render headless best-effort. Corre distinto en Vercel (@sparticuz/chromium) que
// en local; devuelve "" si falla o si no está el binario.
async function renderWithBrowser(url: string): Promise<string> {
  let browser: import("puppeteer-core").Browser | null = null;
  try {
    const puppeteer = (await import("puppeteer-core")).default;
    const chromium = (await import("@sparticuz/chromium")).default;
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 8000 });
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    return text.replace(/\s+/g, " ").trim().slice(0, 5000);
  } catch (err) {
    console.error("render headless falló", err);
    return "";
  } finally {
    try {
      if (browser) await browser.close();
    } catch {
      /* noop */
    }
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
