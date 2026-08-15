# geo-engine — Status (para el chat del proyecto)

> Snapshot de dónde está el producto. Orientado a decisiones, no a código.
> Última actualización: commit `043e4d2`.

**Qué es:** pegás un dominio → reporte gratis de tu visibilidad en respuestas de IA
(share-of-voice vs competidores, en qué preguntas de compra sos invisible) → paywall
→ fix pack pago (contenido citable + schema + acciones off-site). Vertical-agnóstico.
En producción: `geo-engine-seven.vercel.app`.

---

## ✅ Live en prod (funciona e2e)

- **Loop de ingreso completo:** scan → reporte → paywall → checkout (Lemon) → webhook
  → fix pack. Probado con compra real.
- **Multinicho + multi-idioma:** detecta rubro e idioma de cualquier sitio y arma las
  preguntas de compra al vuelo. Ya no es solo skincare/inglés.
- **Tendencia real:** los re-scans de un dominio reusan las mismas preguntas → el
  historial del dashboard es comparable en el tiempo.
- **Producto en inglés** de punta a punta (cliente = DTC angloparlante), incluido el
  entregable pagado.
- **Diseño + motion:** reporte con impacto (el "cachetazo"), pantalla de scanning
  animada, mobile pulido.
- **Robustez de la venta:** el fix pack ya no se cuelga (tope de reintentos + botón de
  retry); la generación corre en un worker de 300s (cola QStash), no al filo de los 60s.
- **Emails transaccionales** activos (Resend): "tu reporte está listo" / "tu fix pack
  está listo".
- **Medición:** `/admin` con el funnel por fuente, Plausible (cookieless), atribución
  UTM cableada.
- **FAQ** pública y honesta (`/faq`).

## 🟡 Pendiente — decisiones / acciones

1. **Dominio de email (bloquea vender a clientes reales):** hoy los mails solo llegan a
   la casilla propia de la cuenta Resend. Para mandarle a clientes de verdad hace falta
   un **dominio propio verificado** (comprar + configurar DNS). Es el único bloqueante
   real para el flujo completo con un cliente externo.
2. **Perplexity (opcional):** sumar la key → 2º engine + citaciones reales. Hoy corre
   solo ChatGPT.
3. **Marketing / go-to-market:** en pausa por decisión. Todo listo para disparar (ver
   abajo). Falta decidir cuándo y por qué canal arrancar.

## 📣 Assets de marketing listos (Teardown skincare)

- Post final anonimizado (`TEARDOWN_skincare_FINAL.md`) + hilos Reddit/X + gráfico.
- Data real de 24 marcas: **19 de 24 son invisibles en ChatGPT** para las preguntas de
  compra de su categoría; ganan siempre los mismos (The Ordinary, CeraVe, La Roche-Posay).
- Plan sugerido por el chat de estrategia: postear anonimizado, un canal a la vez con
  su UTM, mirar `/admin` a las 24-48hs, doblar donde convierte.

## ⚠️ Limitaciones conocidas (honestidad)

- Sitios que bloquean el bot o son 100% JS → no se detecta bien el rubro sin headless
  crawl (hoy apagado). No se "adivina" desde el nombre del dominio.
- Un solo engine (ChatGPT) hasta sumar Perplexity.
- Los emails: ver punto 1 (solo a la casilla propia hasta tener dominio).

## ▶️ Próximo paso sugerido

El producto está sólido y probado en prod. La decisión de mayor palanca ahora es
**go-to-market**: o (a) resolver el dominio de email + arrancar el teardown como primer
experimento de tracción, o (b) sumar Perplexity para robustecer el dato antes de salir.
El wedge (skincare) está lockeado; falta la primera ola de tráfico real.
