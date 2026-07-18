# POS Yery'sCake — Proyecto de Punto de Venta

## Qué es este proyecto

Sistema POS táctil + control de inventario para **Yery'sCake Bonaire** (heladería,
repostería y café en Kralendijk, Bonaire). Fue desarrollado y probado como prototipo
en Claude.ai (artifact HTML) y ahora se continúa aquí para convertirlo en un
**producto comercial instalable** que se venderá por suscripción a tiendas pequeñas
de Bonaire y el Caribe (nombre comercial nuevo por definir).

Dueños: Said Vasquez y Erica Agudelo. Idiomas objetivo: Español, Inglés, Papiamentu.
Moneda: USD.

## Archivos y despliegue

- `app/yeryscake-pos-v2.html` — App principal completa en un solo archivo
  (HTML + CSS + JS vanilla, ~780 KB con fotos de productos embebidas en base64).
- `app/hoy.html` — Panel de solo lectura para el celular de Said: ventas del día
  en vivo (lee de Firebase). Sin contraseña — no compartir el link públicamente.
- `app/produccion.html` — Panel de solo lectura para la tablet del ghost kitchen:
  stock en vivo de postres (bolocups, cheesecakes, fresas con crema, slices,
  tortas, arroz con leche), banner rojo + sonido al llegar al mínimo, todo cabe
  en una pantalla sin deslizar (auto-escala).
- `app/manifest.webmanifest` + `app/sw.js` + `app/icons/` — PWA instalable y
  offline (service worker network-first para el HTML: cada deploy se ve al
  reabrir la app con internet).
- `assets/productos/` — Fotos de productos como JPG individuales (150×150).
- `netlify.toml` — publica la carpeta `app/`.

**Despliegue**: GitHub (`yeryscake/POS`, rama `main`) → Netlify auto-deploy →
`https://golden-marzipan-df7ee2.netlify.app/yeryscake-pos-v2.html`.
La tablet del local lo tiene como PWA en pantalla de inicio; para tomar una
actualización hay que cerrar la app por completo y reabrirla con internet.
Flujo de trabajo: editar aquí → commit → push → pedir en el local que cierren
y reabran la app (idealmente al cierre del día, nunca a media venta).

## Sincronización en la nube (Firebase)

Proyecto Firebase `yeryscake-pos` (Firestore + Auth anónimo). Config embebida en
los 3 HTML (`FIREBASE_CONFIG`). Reglas: lectura pública, escritura solo autenticado.
En cada `save()` la tablet sube en segundo plano (sin bloquear la venta si no hay
internet; icono ☁️/📴 en el header):
- `catalog/main` → items + toppings + priceV (esto permite **detectar cambios
  hechos desde el Admin de la tablet**: bajar el doc, compararlo contra
  `seed()+migrar()` del código, y reflejar las diferencias en el código).
- `days/{YYYY-MM-DD}` → ventas + gastos del día (alimenta `hoy.html`).
- `fiados/main` → lista de fiados.

## Funcionalidades implementadas

- **Vender**: grilla táctil por 10 categorías (~128 artículos + "Varios" precio
  libre), fotos, toppings (franja fija + hoja modal), ticket con cantidades.
  Categorías en **orden de prioridad** (desayunos → cups → cakes → batidos →
  bebidas → waffles → café → jugos → paletas → varios), la app abre en Desayunos.
  **Reorganizar fichas**: mantener presionado un producto ~0.5s activa modo
  edición estilo iPhone (tiemblan y se arrastran); "Listo, guardar orden" guarda
  `pos` por artículo dentro de su categoría.
- **Cobro**: efectivo (devuelta + botones de billetes), tarjeta,
  **transferencia** (🏦, también disponible en abonos de fiados; el cierre
  muestra "DEBE HABER EN TRANSFERENCIAS" solo si hubo), **mixto** (efectivo +
  tarjeta, valida que sumen el total) y fiado. Valida pago insuficiente.
  Anti doble-toque en todos los botones de confirmación.
- **Descuentos**: botón "🏷️ Descuento −5%" (general, sin código) y
  **descuento empleado −12%** — no se acumulan entre sí (activar uno apaga el
  otro); la venta guarda `dctoPct`. El de empleado: botón en la hoja de cobro
  → modal grande pide el código personal de 4 dígitos del empleado → mensaje "¡Gracias por tu gran
  trabajo! Disfrútalo, [nombre] ❤️" → la venta sigue con el precio tachado y
  registra quién lo usó (`dcto`, `dctoPor`). Empleados editables en Admin
  (`S.empleados`, códigos ocultos con toque para ver/ocultar, se ocultan al
  cerrar sesión admin). Empleados actuales: Erica 0207, Dahiana 1312,
  Wilder 8025, Said 4570.
- **Gastos/compras de caja**: botón en Ventas; descripción, monto, método y foto
  de factura opcional (comprimida). Se descuentan del efectivo/tarjeta neto del
  cierre. Eliminar gasto pide código de supervisor.
- **Inventario**: artículos `track:true` con `min` configurable. Badge de stock
  en tiles, alerta roja/amarilla, bloqueo al agotarse. La **alerta de WhatsApp
  solo se abre al CRUZAR un umbral** (llegar al mínimo o llegar a 1), no en cada
  venta — anti-invasivo. Destinatarios por categoría en `S.waDest`. El mensaje
  usa `data-wa` + `location.href` (un apóstrofe en el texto rompía el onclick).
- **Ventas / Cierre del día**: la fecha cambia sola al detectar nuevo día (timer
  + visibilitychange). Dos cierres: **resumido** (solo totales, para archivar) y
  **detallado** (por artículo + gastos). El cierre siempre muestra "DEBE HABER
  EN CAJA (efectivo)" y "DEBE HABER EN TARJETA" (ventas + abonos − gastos) — el
  número contra el que se cuenta la caja (sin contar el fondo fijo, que la app
  NO gestiona todavía). Botón **🖨 por venta individual** para reimprimir un
  comprobante si el cliente lo pide después.
- **Fiados**: descuenta stock al momento, NO cuenta como venta hasta abonar.
  Abonos parciales/totales (efectivo/tarjeta) entran al día en que se abonan.
  La mercancía fiada SÍ cuenta en unidades/por-artículo del día en que salió.
- **Seguridad**: anular venta/fiado/gasto pide código de supervisor. La pestaña
  **Inventario** pide código de supervisor al entrar (se vuelve a bloquear al
  salir de la pestaña). Zona Admin bloqueada con código admin. Códigos por
  defecto: sup `1234`, adm `2580`.
- **Fotos**: DEFAULT_IMGS embebidas por nombre (con alias en `A` para artículos
  renombrados); el admin puede reemplazar desde cámara/galería (IMGS por id).
- **Respaldo**: Admin → exportar/importar `.json` completo.
- **Migración**: `migrar()` con `S.priceV` (va en **13**) — cambios de precios/
  artículos/estructura sin borrar datos. Toda alteración del catálogo o del
  modelo debe ir como nueva versión aquí Y reflejarse en `seed()`.

## Modelo de datos (estado `S`)

```js
S = {
  codes: { sup, adm },
  priceV: 13,
  empleados: [{name, code}],                    // descuento 12%
  waDest: [{num, name, cats:'all'|[catId,...]}],
  toppings: [{id, name, price}],
  items: [{id, name, price, cat, track, stock, min, color, pos}], // pos = orden en la grilla
  sales: [{id, day, time, items:[{name, base, qty, price, itemId|null}], total,
           units, method:'cash'|'card'|'transfer'|'mixed', paid, change,
           cashPart, cardPart, dcto, dctoPor}],
  fiados: [{id, name, day, time, items, total, units, dcto, abonos:[{id,day,time,monto,method}]}],
  gastos: [{id, day, time, desc, monto, method:'cash'|'card', foto|null}]
}
// CATS (en orden de prioridad): desayunos, cups, cakes, batidos, bebidas, waffles, cafe, jugos, paletas, varios
// TOPCATS = ['paletas','cups','waffles']
// IMGS = {itemId: dataURL} · DEFAULT_IMGS = {nombre: dataURL}
```

Precios = lista oficial julio 2026 + ajustes hechos desde Admin (fuente de verdad
del catálogo vivo: la tablet / `catalog/main` en Firebase, no el código).

## Cómo verificar cambios (sin navegador en este entorno)

- Sintaxis JS: extraer los `<script>` y parsear con JavaScriptCore
  (`osascript -l JavaScript` + `new Function(código)`).
- Cruzar todos los `$('id')` contra los `id="..."` del HTML (excluir dinámicos
  `rep-`/`chip-`).
- Probar lógica extrayendo funciones (`datosDia`, `migrar`, etc.) y corriéndolas
  con fixtures en JXA.
- Tras `git push`, verificar el deploy: `curl` del archivo publicado y `diff`
  contra el local (deben ser idénticos).

## Hoja de ruta hacia el producto comercial

1. **Fase actual**: uso diario real en Yery'sCake (iPad en el local) para pulir la operación.
2. **Validación**: presentar a ~5 tiendas de Kralendijk; objetivo 2+ interesadas en ~$20/mes.
3. **Versión comercial** (reconstruir aquí):
   - Empaquetar como app instalable (Capacitor → iPad/Android) con nombre nuevo.
   - Multi-tenant (cuentas por tienda), onboarding sencillo.
   - Impresora de tickets (Epson TM-T20 vía Bluetooth/red es común aquí).
   - Multi-idioma: ES / EN / Papiamentu (ventaja competitiva local clave).
   - Configuración de negocio: logo, moneda, impuestos si aplica.
   - Alertas de stock 100% automáticas (WhatsApp Business Cloud API / Twilio).
   - Fondo de caja inicial configurable (hoy el cierre no lo contempla).
4. **Piloto gratuito** en tiendas locales 1–2 meses → testimonios.
5. **Publicación** en App Store ($99/año) y Play Store ($25 único). Suscripción mensual.

## Preferencias de trabajo de Said

- Comunicación en español, directa y honesta.
- Iterativo: cambios pequeños y probados, sin romper lo que ya funciona.
- Pensado para personal no técnico (Wilder atiende el local): botones grandes,
  flujos simples, todo en español.
- El dispositivo del local es un iPad viejo — el rendimiento importa.
- Antes de publicar cambios que toquen datos: respaldo manual desde Admin y
  actualizar la tablet al cierre del día, no a media venta.
- Al retomar una sesión: revisar `catalog/main` en Firebase por si hubo cambios
  desde el Admin de la tablet, y sincronizarlos al código antes de tocar el catálogo.
