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
~630 KB porque lleva 87 fotos de productos embebidas en base64).
`assets/productos/` — Las mismas 87 fotos como JPG individuales (150×150).

## ⚠️ Primera tarea técnica al retomar

La app usa `window.storage` (API exclusiva de artifacts de Claude.ai). **Fuera de
Claude.ai no funciona.** Para desarrollo local, reemplazar por una capa de
persistencia propia:
- Corto plazo: adaptar a `localStorage` para probar en navegador.
- Producto real: SQLite / IndexedDB con arquitectura offline-first (el internet en
  Bonaire falla; la app NUNCA debe depender de conexión para vender).

Buscar en el código: `window.storage.get`, `window.storage.set` (funciones `load()`,
`save()`, `saveImgs()`).

## Funcionalidades ya implementadas y probadas

- **Vender**: grilla táctil por 9 categorías (~110 artículos), fotos de productos,
  hoja de toppings (14 toppings), ticket con cantidades.
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
- **Fotos**: 87 fotos por defecto embebidas (DEFAULT_IMGS, por nombre de artículo).
  El admin puede reemplazar cualquier foto desde cámara/galería (se recorta cuadrada
  y comprime a 140px, se guarda en IMGS por id). "Restaurar original" vuelve a la
  foto por defecto.
- **Migración de datos**: función `migrar()` con flag `S.priceV` — aplica cambios
  de precios/artículos a datos ya guardados sin borrar ventas ni stock.

## Modelo de datos (estado `S`)

```js
S = {
  codes: { sup:'1234', adm:'2580' },
  priceV: 2,                       // versión de migración de precios
  toppings: [{id, name, price}],
  items: [{id, name, price, cat, track, stock, color}],
  sales: [{id, day:'YYYY-MM-DD', time, items:[{name, base, qty, price, itemId|null}],
           total, units, method:'cash'|'card', paid, change}]
}
// Categorías (CATS): paletas, cups, waffles, cakes, desayunos, batidos, cafe, jugos, bebidas
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
