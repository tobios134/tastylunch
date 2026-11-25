import { initLayout, getJSON, $, fmt, esc } from "./common.js";

const cfg = await initLayout("index.html");
const [viandas, testi] = await Promise.all([getJSON("viandas"), getJSON("testimonios")]);

const pal = cfg.slogan.general.split(" "), ultima = pal.pop();
$("#lema").innerHTML = `${esc(pal.join(" "))} <span class="acento">${esc(ultima)}</span>`;
$("#sl-viandas").textContent = cfg.slogan.viandas + ".";
$("#sl-catering").textContent = cfg.slogan.catering + ".";

// Cifras
const cifras = [
  [viandas.platos.length + "+", "platos para elegir"],
  [viandas.pesoGramos + " g", "por vianda"],
  ["$0", "envío de viandas"],
  [cfg.catering.zonas.length, "zonas de catering"],
];
$("#cifras").innerHTML = cifras.map(([n, t]) => `<div class="cifra"><div class="n">${n}</div><div class="t">${t}</div></div>`).join("");

// Packs
$("#packs-sub").textContent = `Cada vianda suelta cuesta ${fmt(viandas.precioUnitario)}. Todas pesan ${viandas.pesoGramos} g y podés mezclar los platos que quieras.`;
const mejor = Math.max(...viandas.packs.map((p) => p.cantidad));
$("#packs").innerHTML = viandas.packs.map((p) => {
  const porUnidad = p.precio / p.cantidad;
  const ahorro = p.cantidad * viandas.precioUnitario - p.precio;
  return `<div class="pack${p.cantidad === mejor ? " destacado" : ""}">
    <div class="cant">${p.cantidad}</div><div>viandas</div>
    <div class="precio">${fmt(p.precio)}</div>
    <div class="unidad">${fmt(porUnidad)} c/u</div>
    <span class="ahorro">Ahorrás ${fmt(ahorro)}</span>
  </div>`;
}).join("");

// Zonas
$("#zonas-viandas").innerHTML = cfg.viandas.zonas.map((z) => `<li>${esc(z)}</li>`).join("");
$("#zonas-catering").innerHTML = cfg.catering.zonas.map((z) => `<li>${esc(z)}</li>`).join("");

// Testimonios y reseñas
$("#btn-resenas").href = cfg.resenasUrl;
$("#testimonios").innerHTML = testi.testimonios.map((t) => `
  <figure class="testimonio" style="margin:0">
    <blockquote>“${esc(t.texto)}”</blockquote>
    <footer>${esc(t.nombre)}${t.detalle ? `<span>${esc(t.detalle)}</span>` : ""}</footer>
  </figure>`).join("");

// Redes
const r = cfg.redes;
$("#redes").innerHTML = [
  [r.instagramViandas, "Instagram"], [r.instagramEmpresas, "Instagram empresas"], [r.tiktok, "TikTok"], [r.facebook, "Facebook"],
].map(([x, n]) => `<a href="${x.url}" target="_blank" rel="noopener">${n} @${esc(x.usuario)}</a>`).join("");
