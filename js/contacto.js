import { initLayout, $, esc, fmt, waLink } from "./common.js";

const cfg = await initLayout("contacto.html");
const r = cfg.redes;
$("#btn-resenas").href = cfg.resenasUrl;

$("#contacto").innerHTML = `
  <div class="tarjeta"><h3>WhatsApp</h3>
    <p>Pedidos y consultas.</p>
    <a class="btn btn-whats" href="${waLink(cfg.whatsapp, "¡Hola Tasty Lunch!")}" target="_blank" rel="noopener">${esc(cfg.whatsappVisible)}</a></div>
  <div class="tarjeta"><h3>E-mail</h3>
    <p><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></p></div>
  <div class="tarjeta"><h3>Redes</h3>
    <p><a href="${r.instagramViandas.url}" target="_blank" rel="noopener">Instagram @${esc(r.instagramViandas.usuario)}</a><br>
    <a href="${r.instagramEmpresas.url}" target="_blank" rel="noopener">Instagram @${esc(r.instagramEmpresas.usuario)}</a><br>
    <a href="${r.tiktok.url}" target="_blank" rel="noopener">TikTok @${esc(r.tiktok.usuario)}</a><br>
    <a href="${r.facebook.url}" target="_blank" rel="noopener">Facebook @${esc(r.facebook.usuario)}</a></p></div>
  <div class="tarjeta"><h3>Entregas de viandas</h3>
    <p>${cfg.viandas.zonas.map(esc).join(", ")}. Envío sin costo.</p>
    <p>${Object.values(cfg.viandas.entrega).map((d) => `${d.nombre} de ${d.desde} a ${d.hasta} hs`).join("<br>")}</p></div>
  <div class="tarjeta"><h3>Catering</h3>
    <p>Envíos a ${cfg.catering.zonas.map(esc).join(", ")}. Envío sin cargo desde ${fmt(cfg.catering.envioGratisDesde)}.</p>
    <p>Reservá con ${cfg.catering.anticipacionMinDias} días de anticipación como mínimo y hasta ${cfg.catering.anticipacionMaxMeses} meses antes.</p></div>
  <div class="tarjeta"><h3>Punto de retiro (catering)</h3>
    <p>${esc(cfg.retiro.direccion)}<br>${esc(cfg.retiro.horario)}.</p><p>${esc(cfg.retiro.nota)}</p></div>`;
