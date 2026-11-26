import { initLayout, getJSON, $, $$, fmt, esc, waLink, guardar, leer, stepperHTML, abrirDrawer, cerrarDrawer } from "./common.js";

const cfg = await initLayout("viandas.html");
const datos = await getJSON("viandas");
const { precioUnitario, pesoGramos, packs, platos, guarniciones } = datos;
const minimo = datos.minimoViandas;
const CLAVE = "tasty-viandas-carrito";
const CLAVE_FORM = "tasty-viandas-datos";

const EMOJI = { Vegetariano: "🥬", Pollo: "🍗", Carne: "🥩", Cerdo: "🥓", Pescado: "🐟", "Sin definir": "🍽️" };
const individual = (p) => (datos.tiposIndividuales || []).includes(p.tipo);
const conGuarnicion = (p) => datos.todosConGuarnicion || p.conGuarnicion;
const fotoDe = (p) => datos.fotos?.[p.id] || p.foto || datos.fotosPorTipo?.[p.tipo] || datos.fotoPorDefecto;
const porId = new Map(platos.map((p) => [p.id, p]));

$("#intro").textContent = `${cfg.slogan.viandas}.`;
$("#intro-lista").innerHTML = [
  `Cada vianda pesa ${pesoGramos} g`,
  `Las tartas son individuales${datos.tartaDiametroCm ? ` (${datos.tartaDiametroCm} cm)` : ""}`,
  `Pedido mínimo de ${minimo} viandas`,
  "Envío sin costo",
].map((t) => `<li>${esc(t)}</li>`).join("");

/* ---------- Precio óptimo: mejor combinación de packs + sueltas ---------- */
function calcularPrecio(n) {
  if (n <= 0) return { total: 0, partes: [], sinPromo: 0, ahorro: 0 };
  const costo = [0], eleccion = [null];
  for (let i = 1; i <= n; i++) {
    costo[i] = costo[i - 1] + precioUnitario; eleccion[i] = 0;
    packs.forEach((p, k) => {
      if (i >= p.cantidad && costo[i - p.cantidad] + p.precio < costo[i]) { costo[i] = costo[i - p.cantidad] + p.precio; eleccion[i] = p.cantidad; }
    });
  }
  const cuenta = new Map(); let sueltas = 0, i = n;
  while (i > 0) {
    const c = eleccion[i];
    if (c === 0) { sueltas++; i -= 1; } else { cuenta.set(c, (cuenta.get(c) || 0) + 1); i -= c; }
  }
  const partes = [];
  [...cuenta.entries()].sort((a, b) => b[0] - a[0]).forEach(([c, veces]) => {
    const pack = packs.find((p) => p.cantidad === c);
    partes.push({ texto: `${veces} ${veces > 1 ? "packs" : "pack"} de ${c} viandas`, monto: veces * pack.precio });
  });
  if (sueltas) partes.push({ texto: `${sueltas} ${sueltas > 1 ? "viandas sueltas" : "vianda suelta"}`, monto: sueltas * precioUnitario });
  const sinPromo = n * precioUnitario;
  return { total: costo[n], partes, sinPromo, ahorro: sinPromo - costo[n] };
}

/* ---------- Estado ---------- */
let carrito = leer(CLAVE, []).filter((l) => porId.has(l.id) && l.qty > 0);
const filtros = { tipo: null, prot: null, texto: "" };
const guardarCarrito = () => guardar(CLAVE, carrito);
const totalViandas = () => carrito.reduce((s, l) => s + l.qty, 0);

/* ---------- Packs (info) ---------- */
const mayor = Math.max(...packs.map((p) => p.cantidad));
$("#packs").innerHTML = packs.map((p) => `
  <div class="pack${p.cantidad === mayor ? " destacado" : ""}">
    <div class="cant">${p.cantidad}</div><div>viandas</div>
    <div class="precio">${fmt(p.precio)}</div>
    <div class="unidad">${fmt(p.precio / p.cantidad)} c/u</div>
    <span class="ahorro">Ahorrás ${fmt(p.cantidad * precioUnitario - p.precio)}</span>
  </div>`).join("");

/* ---------- Filtros ---------- */
const tiposPresentes = datos.tipos.filter((t) => platos.some((p) => p.tipo === t));
const protPresentes = datos.proteinas.filter((t) => platos.some((p) => p.proteina === t));
const chip = (grupo, valor, texto) => `<button type="button" class="chip" data-grupo="${grupo}" data-valor="${esc(valor ?? "")}" aria-pressed="false">${esc(texto)}</button>`;
$("#f-tipo").innerHTML = chip("tipo", "", "Todos") + tiposPresentes.map((t) => chip("tipo", t, t)).join("");
$("#f-prot").innerHTML = chip("prot", "", "Todas") + protPresentes.map((t) => chip("prot", t, t === "Vegetariano" ? "Veggie" : t)).join("");

function marcarChips() {
  $$(".chip").forEach((c) => c.setAttribute("aria-pressed", String((filtros[c.dataset.grupo] ?? "") === c.dataset.valor)));
}
$(".filtros").addEventListener("click", (e) => {
  const c = e.target.closest(".chip"); if (!c) return;
  filtros[c.dataset.grupo] = c.dataset.valor || null;
  marcarChips(); renderGrilla();
});
$("#buscar").addEventListener("input", (e) => { filtros.texto = e.target.value.trim().toLowerCase(); renderGrilla(); });

/* ---------- Grilla ---------- */
const opcionesGuarnicion = () => {
  const cong = guarniciones.filter((g) => g.tipo.toLowerCase().includes("congelar"));
  const otras = guarniciones.filter((g) => !g.tipo.toLowerCase().includes("congelar"));
  const o = (g) => `<option>${esc(g.nombre)}</option>`;
  return `<option value="">Elegí tu guarnición</option><optgroup label="Ideal para congelar">${cong.map(o).join("")}</optgroup><optgroup label="Otras">${otras.map(o).join("")}</optgroup>`;
};
const HTML_GUAR = opcionesGuarnicion();

function normalizar(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

function renderGrilla() {
  const q = normalizar(filtros.texto);
  const lista = platos.filter((p) =>
    (!filtros.tipo || p.tipo === filtros.tipo) &&
    (!filtros.prot || p.proteina === filtros.prot) &&
    (!q || normalizar(p.nombre + " " + p.tipo + " " + p.proteina + (p.proteina === "Vegetariano" ? " veggie" : "")).includes(q)));
  $("#contador").textContent = `${lista.length} ${lista.length === 1 ? "plato" : "platos"}`;
  $("#grilla").innerHTML = lista.length ? lista.map((p) => `
    <article class="plato" data-id="${p.id}">
      <div class="plato-foto t-${esc(p.tipo)}">
        ${fotoDe(p) ? `<img src="${esc(fotoDe(p))}" alt="${esc(p.nombre)}" loading="lazy" width="800" height="600">` : `<span aria-hidden="true">${EMOJI[p.proteina] || "🍽️"}</span>`}
        <div class="etiquetas"><span class="etiqueta">${esc(p.tipo)}</span>${p.proteina === "Vegetariano" ? '<span class="etiqueta veggie">Veggie</span>' : ""}</div>
      </div>
      <div class="plato-cuerpo">
        <h3>${esc(p.nombre)}</h3>
        <div class="plato-meta">${individual(p) ? "Individual" : pesoGramos + " g"} · ${esc(p.proteina)}${conGuarnicion(p) && !/guarnición/i.test(p.nombre) ? " · con guarnición" : ""}</div>
        ${conGuarnicion(p) ? `<select aria-label="Guarnición de ${esc(p.nombre)}">${HTML_GUAR}</select>` : ""}
        <button class="btn btn-primario btn-chico" type="button" data-accion="agregar">+ Agregar</button>
      </div>
    </article>`).join("") : '<p class="vacio">No encontramos platos con esos filtros.</p>';
}

$("#grilla").addEventListener("click", (e) => {
  const btn = e.target.closest('[data-accion="agregar"]'); if (!btn) return;
  const card = btn.closest(".plato"), id = card.dataset.id, p = porId.get(id);
  const sel = card.querySelector("select");
  let guar = "";
  if (conGuarnicion(p)) {
    guar = sel.value;
    if (!guar) { sel.style.borderColor = "var(--rojo)"; sel.focus(); return; }
    sel.style.borderColor = "";
  }
  agregar(id, guar);
  btn.textContent = "✓ Agregada";
  setTimeout(() => (btn.textContent = "+ Agregar"), 900);
});

/* ---------- Carrito ---------- */
function agregar(id, guarnicion) {
  const key = id + "|" + guarnicion;
  const l = carrito.find((x) => x.key === key);
  if (l) l.qty++; else carrito.push({ key, id, guarnicion, qty: 1 });
  cambio();
}
function cambio() {
  guardarCarrito(); renderBarra(); if ($("#drawer").classList.contains("abierto")) renderLineas();
}

function renderBarra() {
  const n = totalViandas(), barra = $("#barra");
  barra.classList.toggle("visible", n > 0);
  document.body.classList.toggle("con-barra", n > 0);
  if (!n) return;
  const r = calcularPrecio(n);
  $("#barra-txt").textContent = `${n} ${n === 1 ? "vianda" : "viandas"} · ${fmt(r.total)}`;
  $("#barra-sub").textContent = n < minimo ? `Te faltan ${minimo - n} para el pedido mínimo` : "Pedido mínimo cumplido";
}

function nombreLinea(l) { return porId.get(l.id).nombre; }

function renderLineas() {
  const n = totalViandas(), cont = $("#lineas"), res = $("#resumen");
  if (!n) { cont.innerHTML = '<p class="vacio">Todavía no agregaste viandas.</p>'; res.innerHTML = ""; actualizarEnviar(); return; }
  cont.innerHTML = carrito.map((l) => `
    <div class="linea" data-key="${esc(l.key)}">
      <div><div class="linea-nombre">${esc(nombreLinea(l))}</div>${l.guarnicion ? `<div class="linea-det">Guarnición: ${esc(l.guarnicion)}</div>` : ""}</div>
      ${stepperHTML(l.qty, l.key)}
      <button class="quitar" type="button" data-accion="quitar">Quitar</button>
    </div>`).join("");
  const r = calcularPrecio(n);
  const falta = minimo - n;
  const sig = packs.filter((p) => p.cantidad > n && p.cantidad - n <= 4).sort((a, b) => a.cantidad - b.cantidad)[0];
  res.innerHTML = `
    <div class="resumen">
      <div class="fila"><strong>${n} ${n === 1 ? "vianda" : "viandas"}</strong><span></span></div>
      ${falta > 0 ? `<div class="progreso"><div style="width:${Math.round((n / minimo) * 100)}%"></div></div><div class="fila"><span>Pedido mínimo: ${minimo} viandas. Te ${falta === 1 ? "falta 1" : "faltan " + falta}.</span></div>` : ""}
      ${r.partes.map((p) => `<div class="fila"><span>${p.texto}</span><span>${fmt(p.monto)}</span></div>`).join("")}
      ${r.ahorro > 0 ? `<div class="fila ahorro-txt"><span>Ahorro por packs</span><span>− ${fmt(r.ahorro)}</span></div>` : ""}
      <div class="fila total"><span>Total</span><span>${fmt(r.total)}</span></div>
      <div class="fila" style="font-size:.85rem;color:var(--texto-suave)"><span>Envío incluido</span><span>$0</span></div>
    </div>
    ${sig && n >= minimo ? `<p class="aviso">Sumando ${sig.cantidad - n} ${sig.cantidad - n === 1 ? "vianda más" : "viandas más"} completás el pack de ${sig.cantidad} por ${fmt(sig.precio)}.</p>` : ""}`;
  actualizarEnviar();
}

function actualizarEnviar() {
  if (typeof actualizarPago === "function" && $("#info-pago")) actualizarPago();
  const n = totalViandas(), b = $("#enviar");
  b.disabled = n < minimo;
  $("#avisos").innerHTML = n < minimo ? `<p class="aviso" style="margin-top:0">El pedido mínimo es de ${minimo} viandas.</p>` : "";
}

$("#drawer-cuerpo").addEventListener("click", (e) => {
  const linea = e.target.closest(".linea"); if (!linea) return;
  const l = carrito.find((x) => x.key === linea.dataset.key); if (!l) return;
  const acc = e.target.closest("[data-accion]")?.dataset.accion;
  if (acc === "mas") l.qty++;
  else if (acc === "menos") l.qty--;
  else if (acc === "quitar") l.qty = 0;
  else return;
  carrito = carrito.filter((x) => x.qty > 0); cambio();
});
$("#drawer-cuerpo").addEventListener("change", (e) => {
  if (!e.target.matches(".stepper input")) return;
  const l = carrito.find((x) => x.key === e.target.closest(".linea").dataset.key); if (!l) return;
  l.qty = Math.max(0, parseInt(e.target.value, 10) || 0);
  carrito = carrito.filter((x) => x.qty > 0); cambio();
});

/* ---------- Datos de entrega ---------- */
const DIAS_VISTA = 21;
function fechasEntrega() {
  const out = [], hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (let i = cfg.viandas.diasAnticipacion; i <= cfg.viandas.diasAnticipacion + DIAS_VISTA; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() + i);
    const regla = cfg.viandas.entrega[d.getDay()];
    if (regla) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ iso, regla, texto: `${regla.nombre} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` });
    }
  }
  return out;
}
const FECHAS = fechasEntrega();
function franjas(regla) {
  const out = [];
  for (let s = regla.desde; s < regla.hasta; s += 3) out.push(`Entre las ${s} y las ${Math.min(s + 3, regla.hasta)} hs`);
  return out;
}

$("#drawer-cuerpo").innerHTML = `
  <div id="lineas"></div><div id="resumen"></div>
  <h3 style="margin-top:1rem">Datos de entrega</h3>
  <form id="datos" novalidate>
    <label class="campo"><span>Nombre y apellido *</span><input type="text" name="nombre" required autocomplete="name"></label>
    <label class="campo"><span>Zona *</span><select name="zona" required><option value="">Elegí tu zona</option>${cfg.viandas.zonas.map((z) => `<option>${esc(z)}</option>`).join("")}</select></label>
    <label class="campo"><span>Dirección de entrega (calle, número, localidad)</span><input type="text" name="direccion" autocomplete="street-address"></label>
    <label class="campo"><span>Día de entrega *</span><select name="fecha" required><option value="">Elegí un día</option>${FECHAS.map((f) => `<option value="${f.iso}">${f.texto}</option>`).join("")}</select></label>
    <label class="campo"><span>Franja horaria *</span><select name="franja" required><option value="">Primero elegí el día</option></select></label>
    <label class="campo"><span>Medio de pago *</span><select name="pago" required><option value="">Elegí cómo vas a pagar</option><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option></select></label>
    <p id="info-pago" class="aviso oculto"></p>
    <label class="campo"><span>Comentarios (opcional)</span><textarea name="comentarios" placeholder="Piso/depto, alergias, timbre, etc."></textarea></label>
    <p style="font-size:.85rem;color:var(--texto-suave)"><strong>Viandas:</strong> entregamos en ${cfg.viandas.zonas.join(", ")}.<br><strong>Catering:</strong> entregamos en ${cfg.catering.zonas.join(", ")}.</p>
  </form>`;

const form = $("#datos");
form.fecha.addEventListener("change", () => {
  const f = FECHAS.find((x) => x.iso === form.fecha.value);
  form.franja.innerHTML = f ? franjas(f.regla).map((t) => `<option>${t}</option>`).join("") : '<option value="">Primero elegí el día</option>';
});
const SENA = cfg.viandas.senaPorcentaje || 30;
function textoPago(total, medio) {
  if (medio === "Tarjeta") return `Pago del 100% (${fmt(total)}) por link de pago.`;
  if (medio === "Transferencia" || medio === "Efectivo") {
    const sena = Math.round(total * SENA / 100);
    return `Seña del ${SENA}%: ${fmt(sena)}. El resto (${fmt(total - sena)}) se abona contra entrega.`;
  }
  return "";
}
function actualizarPago() {
  const info = $("#info-pago"), t = textoPago(calcularPrecio(totalViandas()).total, form.pago.value);
  info.textContent = t; info.classList.toggle("oculto", !t);
}
form.pago.addEventListener("change", actualizarPago);
// restaurar datos guardados
const previos = leer(CLAVE_FORM, {});
["nombre", "zona", "direccion", "comentarios"].forEach((k) => { if (previos[k]) form[k].value = previos[k]; });
form.addEventListener("input", () => guardar(CLAVE_FORM, { nombre: form.nombre.value, zona: form.zona.value, direccion: form.direccion.value, comentarios: form.comentarios.value }));

/* ---------- Envío por WhatsApp ---------- */
function marcarInvalidos() {
  let primero = null;
  ["nombre", "zona", "fecha", "franja", "pago"].forEach((k) => {
    const campo = form[k], mal = !campo.value.trim();
    campo.style.borderColor = mal ? "var(--rojo)" : "";
    if (mal && !primero) primero = campo;
  });
  return primero;
}

$("#enviar").addEventListener("click", () => {
  const n = totalViandas();
  if (n < minimo) return;
  const malo = marcarInvalidos();
  if (malo) { malo.focus(); $("#avisos").innerHTML = '<p class="aviso error" style="margin-top:0">Completá los datos de entrega marcados en rojo.</p>'; return; }
  const r = calcularPrecio(n);
  const f = FECHAS.find((x) => x.iso === form.fecha.value);
  const lineas = carrito.map((l) => `• ${l.qty} x ${nombreLinea(l)}${l.guarnicion ? ` (guarnición: ${l.guarnicion})` : ""}`).join("\n");
  const msg = [
    "¡Hola Tasty Lunch! Quiero hacer un pedido de viandas:", "",
    lineas, "",
    `Total: ${n} viandas`,
    ...r.partes.map((p) => `- ${p.texto}: ${fmt(p.monto)}`),
    `TOTAL A PAGAR: ${fmt(r.total)} (envío incluido)`, "",
    `Entrega: ${f.texto}, ${form.franja.value.toLowerCase()}`,
    `Medio de pago: ${form.pago.value}`,
    textoPago(r.total, form.pago.value),
    `Zona: ${form.zona.value}`,
    form.direccion.value.trim() ? `Dirección: ${form.direccion.value.trim()}` : "Dirección: a coordinar",
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

marcarChips(); renderGrilla(); renderBarra();
