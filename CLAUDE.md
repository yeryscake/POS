# POS Yery'sCake — Proyecto de Punto de Venta

## Qué es este proyecto

Sistema POS táctil + control de inventario para **Yery'sCake Bonaire** (heladería,
repostería y café en Kralendijk, Bonaire). Fue desarrollado y probado como prototipo
en Claude.ai (artifact HTML) y ahora se continúa aquí para convertirlo en un
**producto comercial instalable** que se venderá por suscripción a tiendas pequeñas
de Bonaire y el Caribe (nombre comercial nuevo por definir).

Dueños: Said Vasquez y Erica Agudelo. Idiomas objetivo: Español, Inglés, Papiamentu.
Moneda: USD.

## Archivo principal

`app/yeryscake-pos-v2.html` — App completa en un solo archivo (HTML + CSS + JS vanilla,
~730 KB porque lleva 109 fotos de productos embebidas en base64).
`assets/productos/` — Las mismas 109 fotos como JPG individuales (150×150).
`app/manifest.webmanifest` + `app/sw.js` + `app/icons/` — PWA instalable y offline.
`netlify.toml` — publica la carpeta `app/` en Netlify sin configuración manual.

## ✅ Persistencia (ya resuelto)

La app ya NO usa `window.storage` (era exclusivo de artifacts de Claude.ai). Ahora
usa **IndexedDB** (`idbGet`/`idbSet`, funciones `load()`, `save()`, `saveImgs()`),
con migración automática desde `localStorage` si encuentra datos de una versión
anterior. Además hay un service worker (`app/sw.js`, network-first para el HTML)
que cachea la app para que funcione sin internet una vez visitada, y un manifest
para poder instalarla desde Safari ("Agregar a inicio").

Pendiente real para el producto comercial: SQLite/backend propio + respaldo en la
nube (por ahora el respaldo es manual vía Admin → "Respaldo de datos", exporta/importa
un `.json` con ventas, inventario, precios y fotos).

## Funcionalidades ya implementadas y probadas

- **Vender**: grilla táctil por 10 categorías (~115 artículos + "Varios" para
  precio libre), fotos de productos, toppings (franja fija + hoja modal), ticket
  con cantidades.
- **Cobro**: efectivo (ingresa con cuánto pagó → calcula devuelta, botones de
  billetes rápidos) o tarjeta. Valida pago insuficiente.
- **Inventario**: solo artículos marcados `track:true` (paletas, bolocups, jugos
  embotellados, bebidas). Botones +/− y reponer. Badge de stock en tiles, alerta
  roja ≤5, bloqueo al agotarse. Los artículos "al momento" (waffles, café, batidos)
  no descuentan stock pero SÍ cuentan en el cierre del día.
- **Ventas / Cierre del día**: totales separados efectivo/tarjeta + total general,
  número de ventas, unidades, más vendido, detalle por venta, resumen imprimible
  por artículo (window.print).
- **Seguridad**: anular factura requiere código de supervisor (modal con input
  tipo password, nunca prompt() nativo). Zona Admin (precios, artículos, toppings,
  fotos, códigos) bloqueada con código de administrador; sesión con botón de cerrar
  que pregunta antes de guardar. Códigos por defecto: supervisor `1234`,
  admin `2580` (cambiables en Admin).
- **Fotos**: fotos por defecto embebidas (DEFAULT_IMGS, por nombre de artículo).
  El admin puede reemplazar cualquier foto desde cámara/galería (se recorta cuadrada
  y comprime a 140px, se guarda en IMGS por id). "Restaurar original" vuelve a la
  foto por defecto.
- **Fiados (cuentas por cobrar)**: tercer método en la hoja de cobro ("Fiado" +
  nombre del cliente). Descuenta stock al momento pero NO cuenta como venta hasta
  que se abona. Pestaña "Fiados": pendientes/pagados, saldo por cobrar, botón
  Abonar (pago parcial o total, efectivo/tarjeta). Los abonos SÍ entran al total
  del día y aparecen en el cierre como línea aparte. Anular fiado requiere código
  de supervisor y devuelve el stock. `S.fiados = [{id, name, day, time, items,
  total, units, abonos:[{day,time,monto,method}]}]`.
- **Alertas de stock por WhatsApp**: cada artículo con inventario tiene `min`
  configurable. Dos niveles: 🔴 rojo (stock ≤ min) y 🟡 amarillo/preventivo. Al
  cobrar, si la venta deja artículos en alerta, se abre hoja con el mensaje armado.
  Destinatarios por categoría en `S.waDest = [{num, name, cats:'all'|[catIds]}]` —
  cada uno recibe solo sus categorías. Botón manual "Alertas de stock" en Inventario.
  Pendiente para la versión comercial: envío 100% automático (WhatsApp Business
  Cloud API / Twilio) en vez de abrir wa.me manualmente.
- **Toppings**: franja fija debajo de la grilla (no solo hoja modal) — se toca un
  topping y se agrega/quita del último producto del ticket con un toque.
- **Venta varios**: categoría "Varios" con teclado numérico para cobrar cualquier
  cosa fuera del catálogo (precio libre + descripción).
- **Respaldo de datos**: Admin → exportar/importar un `.json` con ventas,
  inventario, precios, fiados y fotos (ver sección de Persistencia arriba).
- **Migración de datos**: función `migrar()` con flag `S.priceV` (va en `8`) —
  aplica cambios de precios/artículos/estructura a datos ya guardados sin borrar
  ventas ni stock.

## Modelo de datos (estado `S`)

```js
S = {
  codes: { sup:'1234', adm:'2580' },
  priceV: 8,                       // versión de migración de precios/estructura
  waDest: [{num, name, cats:'all'|[catId,...]}],   // destinatarios de alertas WhatsApp
  toppings: [{id, name, price}],
  items: [{id, name, price, cat, track, stock, min, color}],
  sales: [{id, day:'YYYY-MM-DD', time, items:[{name, base, qty, price, itemId|null}],
           total, units, method:'cash'|'card'|'fiado', paid, change}],
  fiados: [{id, name, day, time, items, total, units, abonos:[{day,time,monto,method}]}]
}
// Categorías (CATS): paletas, cups, waffles, cakes, desayunos, batidos, cafe, jugos, bebidas, varios
// TOPCATS = ['paletas','cups','waffles'] → categorías que ofrecen toppings al vender
// IMGS = {itemId: dataURL}  (fotos personalizadas, storage aparte)
// DEFAULT_IMGS = {nombre: dataURL}  (fotos embebidas por defecto)
```

Precios actuales = lista oficial de julio 2026 (letreros del local). Paletas $3,
bolocups $7, waffles completos $14, etc.

## Hoja de ruta hacia el producto comercial

1. **Fase actual**: uso diario real en Yery'sCake (iPad en el local) para pulir la operación.
2. **Validación**: presentar a ~5 tiendas de Kralendijk; objetivo 2+ interesadas en ~$20/mes.
3. **Versión comercial** (reconstruir aquí):
   - Empaquetar como app instalable (Capacitor → iPad/Android) con nombre nuevo.
   - Persistencia offline-first + respaldo en la nube.
   - Cuentas por tienda (multi-tenant), onboarding sencillo.
   - Soporte de impresora de tickets (Epson TM-T20 vía Bluetooth/red es común aquí).
   - Multi-idioma: ES / EN / Papiamentu (ventaja competitiva local clave).
   - Configuración de negocio: logo, moneda, impuestos si aplica.
4. **Piloto gratuito** en tiendas locales 1–2 meses → testimonios.
5. **Publicación** en App Store ($99/año Apple Developer) y Play Store ($25 único).
   Modelo de suscripción mensual.

## Preferencias de trabajo de Said

- Comunicación en español, directa y honesta.
- Iterativo: cambios pequeños y probados, sin romper lo que ya funciona.
- Pensado para personal no técnico (Wilder atiende el local): botones grandes,
  flujos simples, todo en español.
- El dispositivo del local es un iPad viejo — el rendimiento importa.
