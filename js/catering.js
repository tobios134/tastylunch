import { initLayout, getJSON, $, $$, fmt, esc, waLink, guardar, leer, stepperHTML, abrirDrawer, cerrarDrawer } from "./common.js";

const cfg = await initLayout("catering.html");
const cat = await getJSON("catering");
const CLAVE = "tasty-catering-carrito";
const CLAVE_FORM = "tasty-catering-datos";
const minDias = cfg.catering.anticipacionMinDias, maxMeses = cfg.catering.anticipacionMaxMeses;

$("#intro").innerHTML = `${esc(cfg.slogan.catering)}.<br>Catálogo ${esc(cfg.catering.temporada)}`;
$("#aviso").innerHTML = `<strong>Reservas:</strong> con un mínimo de ${minDias} días y un máximo de ${maxMeses} meses de anticipación.<br><strong>Seña:</strong> del 50% por transferencia, o 100% con tarjeta.<br><strong>Los precios son orientativos:</strong> te confirmamos el presupuesto final por WhatsApp.`;

/* ---------- Catálogo normalizado: id -> item ---------- */
// tipo: "combo" (precio total), "persona" (precio por persona, con mínimo), "bandeja" (cantidad fija por bandeja)
const items = new Map();
const add = (it) => items.set(it.id, it);
cat.combos10a15.items.forEach((c) => add({ id: c.id, nombre: `Combo 10 a 15 personas – ${c.nombre}`, detalle: c.detalle, precio: c.precio, tipo: "combo" }));
cat.combos20mas.items.forEach((c) => add({ id: c.id, nombre: `Combo 20 o más personas – ${c.nombre}`, detalle: c.detalle, precio: c.precio, tipo: "persona", min: cat.combos20mas.personasMin }));
cat.braseados.carnes.forEach((c) => Object.entries(c.precios).forEach(([p, precio]) =>
  add({ id: `${c.id}-${p}`, nombre: `${c.nombre} para ${p} personas`, detalle: [cat.braseados.tamanos[p]], precio, tipo: "combo" })));
add({ id: cat.picada.id, nombre: "Picada", foto: cat.picada.foto, detalle: [cat.picada.detalle], precio: cat.picada.precio, tipo: "persona", min: cat.picada.personasMin });
cat.piezas.grupos.forEach((g) => g.items.forEach((p) => add({ id: p.id, nombre: p.nombre, detalle: p.detalle ? [p.detalle] : [], precio: p.precio, tipo: "bandeja", cantidad: p.cantidad })));

/* ---------- Estado ---------- */
let carrito = leer(CLAVE, []).filter((l) => items.has(l.id) && l.qty > 0);
const guardarCarrito = () => guardar(CLAVE, carrito);
const subtotal = (l) => items.get(l.id).precio * l.qty;
const total = () => carrito.reduce((s, l) => s + subtotal(l), 0);

/* ---------- Paneles ---------- */
const lista = (arr) => `<ul>${arr.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`;

const comboCard = (c) => `
  <article class="combo">
    <h3>${esc(c.nombre)}</h3>
    ${lista(c.detalle)}
    <div class="precio">${fmt(c.precio)} <small>precio total</small></div>
    <div class="acciones"><button class="btn btn-primario btn-chico" type="button" data-agregar="${c.id}">+ Agregar al pedido</button></div>
  </article>`;

const personaCard = (c, min) => `
  <article class="combo${c.foto ? " con-foto" : ""}">
    ${c.foto ? `<img class="combo-foto" src="${esc(c.foto)}" alt="${esc(c.nombre)}" loading="lazy">` : ""}
    <h3>${esc(c.nombre)}</h3>
    ${lista(c.detalle)}
    <div class="precio">${fmt(c.precio)} <small>aprox. por persona</small></div>
    <div class="acciones">
      <label style="font-size:.85rem;font-weight:700">Personas<br><input type="number" min="${min}" value="${min}" style="width:90px" data-personas="${c.id}" inputmode="numeric"></label>
      <button class="btn btn-primario btn-chico" type="button" data-agregar="${c.id}">+ Agregar al pedido</button>
    </div>
  </article>`;

const TAM = Object.keys(cat.braseados.tamanos);
const braseadoCard = (c) => `
  <article class="combo con-foto" data-carne="${c.id}">
    ${c.foto ? `<img class="combo-foto" src="${esc(c.foto)}" alt="${esc(c.nombre)}" loading="lazy">` : ""}
    <h3>${esc(c.nombre)}</h3>
    <p style="margin:0;font-size:.9rem">${esc(c.nota)}</p>
    <div class="sel-tamano" role="group" aria-label="Cantidad de personas">
      ${TAM.map((t, i) => `<button type="button" class="chip" data-tam="${t}" aria-pressed="${i === 0}">${t} personas</button>`).join("")}
    </div>
    <ul class="det-tam"></ul>
    <div class="precio"><span class="monto"></span> <small>precio total</small></div>
    <div class="acciones"><button class="btn btn-primario btn-chico" type="button" data-agregar="">+ Agregar al pedido</button></div>
  </article>`;

const piezaCard = (p) => `
  <article class="pieza">
    <h4>${esc(p.nombre)}</h4>
    <div class="det"><strong>Bandeja de ${p.cantidad} unidades.</strong> ${esc(p.detalle)}</div>
    <div class="pie"><span class="precio">${fmt(p.precio)}</span>
      <button class="btn btn-primario btn-chico" type="button" data-agregar="${p.id}">+ Agregar</button></div>
  </article>`;

const PANELES = [
  { id: "p-10", titulo: "10 a 15 personas", html: () => `<p>${esc(cat.combos10a15.descripcion)}</p><div class="combo-grid">${cat.combos10a15.items.map((c) => comboCard(items.get(c.id))).join("")}</div>` },
  { id: "p-20", titulo: "20 personas o más", html: () => `<p>${esc(cat.combos20mas.descripcion)}</p><div class="combo-grid">${cat.combos20mas.items.map((c) => personaCard(items.get(c.id), cat.combos20mas.personasMin)).join("")}</div>` },
  { id: "p-brasa", titulo: "Pernil, bondiola y carne", html: () => `<p>${esc(cat.braseados.descripcion)}</p><div class="combo-grid">${cat.braseados.carnes.map(braseadoCard).join("")}</div>` },
  { id: "p-picada", titulo: "Picada", html: () => `<div class="combo-grid">${personaCard(items.get("picada"), cat.picada.personasMin)}</div>` },
  { id: "p-piezas", titulo: "Por piezas", html: () => `<div class="galeria">${(cat.galeria || []).map((g) => `<img src="${esc(g.archivo)}" alt="${esc(g.alt)}" loading="lazy" width="800" height="800">`).join("")}</div><p>${esc(cat.piezas.descripcion)}</p>${cat.piezas.grupos.map((g) => `
      <h3 class="grupo-titulo">${esc(g.nombre)}</h3><div class="combo-grid">${g.items.map(piezaCard).join("")}</div>`).join("")}` },
];

$("#pestanas").innerHTML = PANELES.map((p, i) => `<button type="button" class="chip" role="tab" data-panel="${p.id}" aria-pressed="${i === 0}" aria-selected="${i === 0}">${p.titulo}</button>`).join("");
$("#paneles").innerHTML = PANELES.map((p, i) => `<section class="panel" id="${p.id}" role="tabpanel" ${i ? "hidden" : ""}>${p.html()}</section>`).join("") + `
  <div class="tarjeta centrado" style="margin-top:2rem">
    <h3>¿Buscás algo a medida?</h3>
    <p>Contanos tu evento y armamos un presupuesto para vos.</p>
    <button class="btn btn-secundario" type="button" id="abrir-presupuesto">Pedir presupuesto</button>
  </div>`;

$("#pestanas").addEventListener("click", (e) => {
  const b = e.target.closest("[data-panel]"); if (!b) return;
  $$("#pestanas .chip").forEach((c) => { const on = c === b; c.setAttribute("aria-pressed", on); c.setAttribute("aria-selected", on); });
  $$(".panel").forEach((p) => (p.hidden = p.id !== b.dataset.panel));
});

/* Braseados: selector de tamaño */
function actualizarBraseado(card, tam) {
  const c = cat.braseados.carnes.find((x) => x.id === card.dataset.carne);
  $$(".sel-tamano .chip", card).forEach((b) => b.setAttribute("aria-pressed", b.dataset.tam === tam));
  $(".det-tam", card).innerHTML = `<li>${esc(cat.braseados.tamanos[tam])}</li>`;
  $(".monto", card).textContent = fmt(c.precios[tam]);
  $("[data-agregar]", card).dataset.agregar = `${c.id}-${tam}`;
}
$$("[data-carne]").forEach((card) => actualizarBraseado(card, TAM[0]));
$("#paneles").addEventListener("click", (e) => {
  const t = e.target.closest("[data-tam]");
  if (t) { actualizarBraseado(t.closest("[data-carne]"), t.dataset.tam); return; }
  const a = e.target.closest("[data-agregar]");
  if (a) {
    const id = a.dataset.agregar, it = items.get(id);
    let qty = 1;
    if (it.tipo === "persona") {
      const inp = a.closest(".combo").querySelector("[data-personas]");
      qty = Math.max(it.min, parseInt(inp.value, 10) || it.min);
      inp.value = qty;
    }
    agregar(id, qty);
    const original = a.textContent; a.textContent = "✓ Agregado"; setTimeout(() => (a.textContent = original), 900);
  }
  if (e.target.closest("#abrir-presupuesto")) abrir();
});

/* ---------- Carrito ---------- */
function agregar(id, qty) {
  const l = carrito.find((x) => x.id === id);
  if (l) l.qty = items.get(id).tipo === "persona" ? qty : l.qty + qty; else carrito.push({ id, qty, gustos: "" });
  cambio();
}
function cambio() { guardarCarrito(); renderBarra(); if ($("#drawer").classList.contains("abierto")) renderLineas(); }

function renderBarra() {
  const barra = $("#barra"), n = carrito.length;
  barra.classList.toggle("visible", n > 0);
  document.body.classList.toggle("con-barra", n > 0);
  if (n) $("#barra-txt").textContent = `${n} ${n === 1 ? "ítem" : "ítems"} · ${fmt(total())}`;
}

function descLinea(l, it) {
  if (it.tipo === "persona") return `${l.qty} personas × ${fmt(it.precio)} (aprox.)`;
  if (it.tipo === "bandeja") return `${l.qty} ${l.qty === 1 ? "bandeja" : "bandejas"} de ${it.cantidad} = ${l.qty * it.cantidad} unidades`;
  return `${l.qty} ${l.qty === 1 ? "combo" : "combos"}`;
}

function renderLineas() {
  const cont = $("#lineas"), res = $("#resumen");
  if (!carrito.length) { cont.innerHTML = '<p class="vacio">Todavía no agregaste nada. Podés pedir un presupuesto a medida completando los datos.</p>'; res.innerHTML = ""; return; }
  cont.innerHTML = carrito.map((l) => {
    const it = items.get(l.id);
    return `<div class="linea" data-id="${l.id}">
      <div><div class="linea-nombre">${esc(it.nombre)}</div><div class="linea-det">${esc(descLinea(l, it))}</div></div>
      ${stepperHTML(l.qty, l.id)}
      <input type="text" data-gustos placeholder="Gustos / rellenos elegidos (opcional)" value="${esc(l.gustos)}" style="grid-column:1/-1;min-height:38px;padding:.4rem .7rem;font-size:.9rem" aria-label="Gustos de ${esc(it.nombre)}">
      <span class="linea-precio" style="text-align:left">${fmt(subtotal(l))}</span>
      <button class="quitar" type="button" data-accion="quitar">Quitar</button>
    </div>`;
  }).join("");
  res.innerHTML = `<div class="resumen"><div class="fila total"><span>Total estimado</span><span>${fmt(total())}</span></div>
    <div class="fila" style="font-size:.85rem;color:var(--texto-suave)"><span>${total() >= cfg.catering.envioGratisDesde ? "Envío sin cargo." : `Envío sin cargo desde ${fmt(cfg.catering.envioGratisDesde)}; por debajo, a convenir.`} Presupuesto final a confirmar.</span></div></div>`;
}

$("#drawer-cuerpo").addEventListener("click", (e) => {
  const linea = e.target.closest(".linea"); if (!linea) return;
  const l = carrito.find((x) => x.id === linea.dataset.id), it = items.get(l.id);
  const acc = e.target.closest("[data-accion]")?.dataset.accion;
  if (acc === "mas") l.qty++;
  else if (acc === "menos") l.qty = (it.tipo === "persona" && l.qty - 1 < it.min) ? 0 : l.qty - 1;
  else if (acc === "quitar") l.qty = 0;
  else return;
  carrito = carrito.filter((x) => x.qty > 0); cambio();
});
$("#drawer-cuerpo").addEventListener("change", (e) => {
  if (!e.target.matches(".stepper input")) return;
  const l = carrito.find((x) => x.id === e.target.closest(".linea").dataset.id), it = items.get(l.id);
  let v = parseInt(e.target.value, 10) || 0;
  if (it.tipo === "persona" && v > 0) v = Math.max(it.min, v);
  l.qty = v; carrito = carrito.filter((x) => x.qty > 0); cambio();
});
$("#drawer-cuerpo").addEventListener("input", (e) => {
  if (!e.target.matches("[data-gustos]")) return;
  const l = carrito.find((x) => x.id === e.target.closest(".linea").dataset.id);
  l.gustos = e.target.value; guardarCarrito();
});

/* ---------- Formulario ---------- */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const fMin = new Date(hoy); fMin.setDate(fMin.getDate() + minDias);
const fMax = new Date(hoy); fMax.setMonth(fMax.getMonth() + maxMeses);

$("#drawer-cuerpo").innerHTML = `
  <div id="lineas"></div><div id="resumen"></div>
  <h3 style="margin-top:1rem">Datos del evento</h3>
  <form id="datos" novalidate>
    <label class="campo"><span>Nombre y apellido *</span><input type="text" name="nombre" required autocomplete="name"></label>
    <label class="campo"><span>Fecha del evento * (entre ${fMin.toLocaleDateString("es-AR")} y ${fMax.toLocaleDateString("es-AR")})</span><input type="date" name="fecha" required min="${iso(fMin)}" max="${iso(fMax)}"></label>
    <label class="campo"><span>Cantidad de personas *</span><input type="number" name="personas" required min="1" inputmode="numeric"></label>
    <label class="campo"><span>Tipo de evento *</span><select name="evento" required><option value="">Elegí una opción</option><option>Cumpleaños</option><option>Casamiento</option><option>Evento corporativo</option><option>Reunión familiar o de amigos</option><option>Otro</option></select></label>
    <label class="campo"><span>¿Envío o retiro? *</span><select name="modo" required><option value="Envío">Envío</option><option value="Retiro">Retiro por Villa Ballester</option></select></label>
    <div id="bloque-envio">
      <label class="campo"><span>Zona *</span><select name="zona"><option value="">Elegí tu zona</option>${cfg.catering.zonas.map((z) => `<option>${esc(z)}</option>`).join("")}</select></label>
      <label class="campo"><span>Dirección o localidad del evento *</span><input type="text" name="direccion" autocomplete="street-address"></label>
    </div>
    <p id="nota-retiro" class="aviso oculto">Retiro en ${esc(cfg.retiro.direccion)}, ${esc(cfg.retiro.horario)}. ${esc(cfg.retiro.nota)}</p>
    <label class="campo"><span>Comentarios (opcional)</span><textarea name="comentarios" placeholder="Horario, alergias, preferencias, etc."></textarea></label>
  </form>`;

const form = $("#datos");
const bloque = $("#bloque-envio"), notaRetiro = $("#nota-retiro");
const actualizarModo = () => { const envio = form.modo.value === "Envío"; bloque.classList.toggle("oculto", !envio); notaRetiro.classList.toggle("oculto", envio); };
form.modo.addEventListener("change", actualizarModo);
const previos = leer(CLAVE_FORM, {});
["nombre", "personas", "evento", "modo", "zona", "direccion", "comentarios"].forEach((k) => { if (previos[k]) form[k].value = previos[k]; });
actualizarModo();
form.addEventListener("input", () => guardar(CLAVE_FORM, Object.fromEntries(["nombre", "personas", "evento", "modo", "zona", "direccion", "comentarios"].map((k) => [k, form[k].value]))));

/* ---------- Envío por WhatsApp ---------- */
$("#enviar").addEventListener("click", () => {
  const envio = form.modo.value === "Envío";
  const req = ["nombre", "fecha", "personas", "evento"].concat(envio ? ["zona", "direccion"] : []);
  let primero = null;
  ["nombre", "fecha", "personas", "evento", "zona", "direccion"].forEach((k) => { form[k].style.borderColor = ""; });
  req.forEach((k) => { if (!form[k].value.trim() && !primero) primero = form[k]; if (!form[k].value.trim()) form[k].style.borderColor = "var(--rojo)"; });
  const f = form.fecha.value;
  const fechaMala = f && (f < iso(fMin) || f > iso(fMax));
  if (fechaMala) { form.fecha.style.borderColor = "var(--rojo)"; primero = primero || form.fecha; }
  if (primero) {
    primero.focus();
    $("#avisos").innerHTML = `<p class="aviso error" style="margin-top:0">${fechaMala && f ? `La fecha debe estar entre ${minDias} días y ${maxMeses} meses desde hoy.` : "Completá los datos marcados en rojo."}</p>`;
    return;
  }
  $("#avisos").innerHTML = "";
  const [y, m, d] = f.split("-");
  const lineas = carrito.map((l) => {
    const it = items.get(l.id);
    return `• ${it.nombre} – ${descLinea(l, it)} – ${fmt(subtotal(l))}${l.gustos.trim() ? `\n   Gustos: ${l.gustos.trim()}` : ""}`;
  });
  const msg = [
    `¡Hola Tasty Lunch! Quisiera un presupuesto de catering.`, "",
    carrito.length ? "Pedido:" : "Quiero un presupuesto a medida.",
    ...lineas,
    carrito.length ? `\nTotal estimado: ${fmt(total())}` : "", "",
    `Fecha del evento: ${d}/${m}/${y}`,
    `Personas: ${form.personas.value}`,
    `Tipo de evento: ${form.evento.value}`,
    envio ? `Envío a: ${form.direccion.value.trim()} (${form.zona.value})${total() >= cfg.catering.envioGratisDesde ? " – sin cargo" : ""}` : "Retiro en Villa Ballester",
    `Nombre: ${form.nombre.value.trim()}`,
    form.comentarios.value.trim() ? `Comentarios: ${form.comentarios.value.trim()}` : "",
  ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
  window.open(waLink(cfg.whatsapp, msg), "_blank", "noopener");
});

/* ---------- Drawer ---------- */
const drawer = $("#drawer"), fondo = $("#fondo");
const abrir = () => { renderLineas(); abrirDrawer(drawer, fondo); drawer.setAttribute("aria-hidden", "false"); };
const cerrar = () => { cerrarDrawer(drawer, fondo); drawer.setAttribute("aria-hidden", "true"); };
$("#abrir-carrito").addEventListener("click", abrir);
$("#cerrar").addEventListener("click", cerrar);
fondo.addEventListener("click", cerrar);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });

renderBarra();
