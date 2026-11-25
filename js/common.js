// Utilidades y layout compartido (header, footer, botón de WhatsApp)

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");

export function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function getJSON(nombre) {
  const r = await fetch(`data/${nombre}.json`);
  if (!r.ok) throw new Error(`No se pudo cargar data/${nombre}.json`);
  return r.json();
}

export const waLink = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

export function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}
export function leer(clave, defecto) {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; } catch { return defecto; }
}

const PAGINAS = [
  ["index.html", "Inicio"],
  ["viandas.html", "Viandas"],
  ["catering.html", "Catering"],
  ["faq.html", "Preguntas frecuentes"],
  ["contacto.html", "Contacto"],
];

export async function initLayout(actual) {
  const cfg = await getJSON("config");
  const ico = '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200Zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8s-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.1 0-.3 0-.4l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200 5.200 5.200 0 0 0 1.100 2.800 11.900 11.900 0 0 0 4.600 4c1.700.7 2.400.800 3.200.700a2.700 2.700 0 0 0 1.800-1.300 2.200 2.200 0 0 0 .2-1.300c-.1-.1-.3-.2-.6-.3Z"/></svg>';

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="sitio-header">
      <div class="contenedor">
        <a class="logo" href="index.html" aria-label="${esc(cfg.negocio)} – inicio"><img src="assets/img/logo.png" alt="${esc(cfg.negocio)}"></a>
        <button class="menu-btn" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav">☰</button>
        <nav class="nav" id="nav" aria-label="Principal">
          ${PAGINAS.map(([h, t]) => `<a href="${h}"${h === actual ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
        </nav>
      </div>
    </header>`);

  const btn = $(".menu-btn"), nav = $("#nav");
  btn.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierto");
    btn.setAttribute("aria-expanded", abierto);
  });

  const r = cfg.redes;
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="sitio-footer">
      <div class="contenedor">
        <div class="footer-grid">
          <div>
            <img src="assets/img/logo-blanco.png" alt="${esc(cfg.negocio)}">
            <p>${esc(cfg.slogan.general)}.</p>
          </div>
          <div>
            <h3>Contacto</h3>
            <ul>
              <li><a href="${waLink(cfg.whatsapp, "¡Hola Tasty Lunch!")}" target="_blank" rel="noopener">WhatsApp ${esc(cfg.whatsappVisible)}</a></li>
              <li><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></li>
              <li>CABA, Zona Norte, Zona Oeste y Zona Sur</li>
            </ul>
          </div>
          <div>
            <h3>Seguinos</h3>
            <ul>
              <li><a href="${r.instagramViandas.url}" target="_blank" rel="noopener">Instagram @${esc(r.instagramViandas.usuario)}</a></li>
              <li><a href="${r.instagramEmpresas.url}" target="_blank" rel="noopener">Instagram @${esc(r.instagramEmpresas.usuario)}</a></li>
              <li><a href="${r.tiktok.url}" target="_blank" rel="noopener">TikTok @${esc(r.tiktok.usuario)}</a></li>
              <li><a href="${r.facebook.url}" target="_blank" rel="noopener">Facebook @${esc(r.facebook.usuario)}</a></li>
            </ul>
          </div>
        </div>
        <p class="copy">© ${new Date().getFullYear()} ${esc(cfg.negocio)}. Monotributistas, factura C.</p>
      </div>
    </footer>
    <a class="whats-flotante" href="${waLink(cfg.whatsapp, "¡Hola Tasty Lunch! Quisiera hacer una consulta.")}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">${ico}</a>`);

  return cfg;
}

/* Controles reutilizables */
export function stepperHTML(valor, id = "") {
  return `<div class="stepper" data-id="${esc(id)}">
    <button type="button" data-accion="menos" aria-label="Quitar uno">−</button>
    <input type="number" inputmode="numeric" min="0" value="${valor}" aria-label="Cantidad">
    <button type="button" data-accion="mas" aria-label="Agregar uno">+</button>
  </div>`;
}

export function abrirDrawer(drawer, fondo) {
  drawer.classList.add("abierto"); fondo.classList.add("abierto");
  document.body.style.overflow = "hidden";
}
export function cerrarDrawer(drawer, fondo) {
  drawer.classList.remove("abierto"); fondo.classList.remove("abierto");
  document.body.style.overflow = "";
}
