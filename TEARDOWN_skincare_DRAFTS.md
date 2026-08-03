# Drafts de posteo — teardown skincare (listos para pegar)

> Regla que respetan todos: se aporta el dato, no se vende. El link va en comentario
> (Reddit) o al final del hilo (X), nunca como lo primero.

---

## 1) Reddit — r/ecommerce o r/shopify (ángulo dueño de marca)

**Título:**
> I asked ChatGPT the 15 skincare questions shoppers actually ask, for 24 popular brands. 19 were invisible — never recommended once.

**Cuerpo:**
> I run into a lot of DTC founders obsessing over Google SEO while their customers
> have quietly started asking ChatGPT "what should I buy for X." So I ran a test.
>
> I took 24 of the most-hyped skincare brands (The Ordinary, Glossier, Drunk
> Elephant, COSRX, Paula's Choice, Youth to the People, Starface, Beauty of Joseon,
> etc.) and asked ChatGPT the **same 15 category buying questions** for each —
> "best vitamin C serum for dull skin", "best gentle cleanser for sensitive skin",
> "best daily sunscreen with no white cast", and so on. Same questions for every
> brand, so it's an apples-to-apples ranking.
>
> Results:
> - **19 of the 24 brands were invisible** — zero mentions across all 15 questions.
> - Only 5 got *any* airtime: The Ordinary (15% share-of-voice), Paula's Choice (8%),
>   then Biossance / COSRX / Drunk Elephant at ~2%.
> - ChatGPT kept naming the same handful: **The Ordinary was the #1 recommendation
>   in 19 of 24 answer sets**, then CeraVe and La Roche-Posay.
>
> What stood out to me as an ecommerce thing:
> 1. **Instagram/TikTok buzz did nothing.** The most hyped DTC names scored a flat 0.
> 2. **The winners all share a trait:** tons of citable, structured, third-party
>    content (derm write-ups, ingredient pages, "best of" lists). That's what the
>    model is grounded on. The Ordinary won on being written about everywhere, not on hype.
> 3. Unlike SEO there's no page 2 — you're either in the answer or you don't exist.
>
> Curious if others have checked their own category. Happy to share the full method
> + table in the comments if useful.

**Primer comentario (con el link, después de que arranque la discusión):**
> For anyone who wants to check their own store, I built the scanner I used here:
> [link]. Full method: one engine (ChatGPT), 15 fixed category prompts, share-of-voice
> = % of brand mentions that were you. Not perfect (one engine, one snapshot) but it's
> the same snapshot for everyone.

*Nota: en r/SkincareAddiction el self-promo es más estricto — ahí conviene postear solo
el dato + tabla, sin ningún link, y responder por DM si preguntan.*

---

## 2) X / Twitter — hilo

**Tweet 1 (hook):**
> I asked ChatGPT the 15 skincare questions people actually ask before buying.
>
> Then checked 24 of the most-hyped brands.
>
> 19 of them never came up. Not once. 🧵

**Tweet 2:**
> Same 15 category questions for every brand — "best vitamin C serum for dull skin",
> "best gentle cleanser for sensitive skin", etc. Apples-to-apples.
>
> Only 5 of 24 brands got ANY mention:
> The Ordinary 15% · Paula's Choice 8% · Biossance / COSRX / Drunk Elephant ~2%.

**Tweet 3:**
> Invisible in 100% of the questions — zero mentions:
>
> Glossier · Drunk Elephant · Youth to the People · Starface · Topicals · Versed ·
> Bubble · The Inkey List · Glow Recipe · Beauty of Joseon · Krave Beauty · +8 more.
>
> Millions of followers between them. ChatGPT recommends none.

**Tweet 4:**
> ChatGPT kept naming the same 3: The Ordinary, CeraVe, La Roche-Posay.
>
> The Ordinary was the #1 pick in 19 of 24 answer sets.
>
> It didn't win on hype. It won on being written about everywhere, in a way the model can cite.

**Tweet 5:**
> The takeaway for DTC:
>
> Shopping is moving into the chat box. A missing mention = a missing sale, and there's
> no page 2 to scroll to.
>
> Buzz ≠ AI visibility. Citable, structured content is the new shelf placement.

**Tweet 6 (CTA):**
> If you want to see where your store lands, I built the scanner I used — free, ~60s:
> [link]
>
> (one engine, 15 prompts, same snapshot for everyone — a starting point, not gospel)

**Imágenes sugeridas:** adjuntar las OG image de las report cards más shockeantes
(Glossier 100% invisible, Drunk Elephant 93%) en el tweet 3, y la de The Ordinary
en el tweet 4. Links en TEARDOWN_skincare_POST.md.

---

## Checklist antes de publicar
- [ ] Reemplazar `[link]` por https://geo-engine-seven.vercel.app (con `?utm_source=reddit`
      o `?utm_source=x` para que aparezca por fuente en /admin).
- [ ] Confirmar que el deploy con la landing en inglés ya está live (lo está: commit 6831fe5).
- [ ] Reddit: postear el dato primero, link recién en comentario.
- [ ] Guardar los links de los posts para trackear qué canal convierte.
