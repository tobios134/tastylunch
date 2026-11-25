import { initLayout, getJSON, $, esc, waLink } from "./common.js";

const cfg = await initLayout("faq.html");
const faq = await getJSON("faq");
$("#btn-wa").href = waLink(cfg.whatsapp, "¡Hola Tasty Lunch! Tengo una consulta.");

const secciones = [...new Set(faq.map((f) => f.seccion))];
$("#faq").innerHTML = secciones.map((s) => `
  <h2 style="margin-top:1.5rem">${esc(s)}</h2>
  ${faq.filter((f) => f.seccion === s).map((f) => `
    <details><summary>${esc(f.pregunta)}</summary><div class="resp">${esc(f.respuesta)}</div></details>`).join("")}
`).join("");
