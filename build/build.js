#!/usr/bin/env node
/*
 * Minimal static-site build: assembles head + header + page content + footer
 * for every page in PAGES, writing plain static HTML to the project root.
 * No dependencies, no bundler — just string templates.
 */
const fs = require("fs");
const path = require("path");

const PROJECT_DIR = path.join(__dirname, "..");
const OUT_DIR = path.join(PROJECT_DIR, "dist");
const PARTIALS_DIR = path.join(__dirname, "partials");
const PAGES_DIR = path.join(__dirname, "pages");

const NAV_ITEMS = [
  { key: "home", label: "Inicio", href: "index.html" },
  {
    key: "servicios",
    label: "Servicios",
    dropdown: [
      { key: "corte-laser", label: "Corte Láser de Metales", href: "corte-laser/index.html" },
      { key: "plegado-cnc", label: "Plegado CNC", href: "plegado-cnc/index.html" },
    ],
  },
  { key: "materiales", label: "Materiales", href: "materiales/index.html" },
  { key: "capacidad-instalada", label: "Capacidad", href: "capacidad-instalada/index.html" },
  { key: "industrias", label: "Industrias", href: "industrias/index.html" },
  { key: "proyectos", label: "Proyectos", href: "proyectos/index.html" },
  { key: "nosotros", label: "Nosotros", href: "nosotros/index.html" },
  { key: "cotizar", label: "Contáctenos", href: "cotizar/index.html" },
];

const PAGES = [
  {
    key: "home",
    outDir: "",
    contentFile: "home.html",
    title: "Laser Steel S.A.S. | Corte Láser de Metales y Plegado CNC en Bogotá",
    description:
      "Laser Steel S.A.S.: corte láser de metales con tecnología CNC y plegado CNC para la industria en Bogotá y toda Colombia. Fabricación bajo plano, precisión y cumplimiento.",
  },
  {
    key: "corte-laser",
    outDir: "corte-laser",
    contentFile: "corte-laser.html",
    title: "Corte Láser de Metales con Tecnología CNC | Laser Steel",
    description:
      "Corte láser CNC de acero al carbono, inoxidable, aluminio, galvanizado y latón. Precisión, cortes limpios y fabricación bajo plano para la industria.",
  },
  {
    key: "plegado-cnc",
    outDir: "plegado-cnc",
    contentFile: "plegado-cnc.html",
    title: "Plegado CNC de Metales para Componentes de Alta Precisión | Laser Steel",
    description:
      "Plegado CNC de láminas metálicas con precisión, repetibilidad y calidad para aplicaciones industriales. Fabricación bajo plano.",
  },
  {
    key: "capacidad-instalada",
    outDir: "capacidad-instalada",
    contentFile: "capacidad-instalada.html",
    title: "Capacidad Instalada | Laser Steel S.A.S.",
    description:
      "Infraestructura, tecnología y capacidad productiva de Laser Steel: cortadoras láser de fibra y dobladoras CNC para proyectos industriales.",
  },
  {
    key: "materiales",
    outDir: "materiales",
    contentFile: "materiales.html",
    title: "Materiales que Procesamos | Laser Steel S.A.S.",
    description:
      "Acero al carbono (CR y HR), acero inoxidable, aluminio, acero galvanizado y latón. Conozca los materiales que procesamos en Laser Steel.",
  },
  {
    key: "industrias",
    outDir: "industrias",
    contentFile: "industrias.html",
    title: "Soluciones para Diferentes Sectores Industriales | Laser Steel",
    description:
      "Manufactura, maquinaria, construcción, arquitectura, energía, minería, petróleo y gas, agroindustria y transporte — soluciones metálicas para cada sector.",
  },
  {
    key: "proyectos",
    outDir: "proyectos",
    contentFile: "proyectos.html",
    title: "Proyectos | Laser Steel S.A.S.",
    description:
      "Conozca proyectos reales desarrollados por Laser Steel: piezas y componentes metálicos fabricados con precisión para la industria.",
  },
  {
    key: "nosotros",
    outDir: "nosotros",
    contentFile: "nosotros.html",
    title: "¿Por Qué Laser Steel? | Un Aliado para la Industria",
    description:
      "Experiencia, compromiso y una forma de trabajar orientada a relaciones de largo plazo. Conozca la historia y los principios de Laser Steel S.A.S.",
  },
  {
    key: "cotizar",
    outDir: "cotizar",
    contentFile: "cotizar.html",
    title: "Solicitar Cotización | Laser Steel S.A.S.",
    description:
      "Envíenos su plano o requerimiento técnico y reciba una cotización ajustada a las necesidades de su proyecto.",
  },
  {
    key: "404",
    outDir: "",
    outFile: "404.html",
    contentFile: "404.html",
    title: "Página no encontrada | Laser Steel S.A.S.",
    description: "La página que buscas no existe o fue movida.",
  },
];

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function buildNav(activeKey) {
  return NAV_ITEMS.map((item) => {
    if (item.dropdown) {
      const isActive = item.dropdown.some((d) => d.key === activeKey);
      const subLinks = item.dropdown
        .map(
          (d) =>
            `<a href="{{ROOT}}${d.href}" class="dropdown-link${d.key === activeKey ? " active" : ""}">${d.label}</a>`
        )
        .join("\n        ");
      return `<div class="nav-item has-dropdown${isActive ? " active" : ""}">
        <span class="nav-toplevel">${item.label}</span>
        <div class="dropdown-menu">
        ${subLinks}
        </div>
      </div>`;
    }
    return `<a href="{{ROOT}}${item.href}" class="${item.key === activeKey ? "active" : ""}">${item.label}</a>`;
  }).join("\n      ");
}

function rootPrefix(outDir) {
  return outDir ? "../" : "";
}

function assemble(page) {
  const head = read(path.join(PARTIALS_DIR, "head.html"));
  const header = read(path.join(PARTIALS_DIR, "header.html"));
  const footer = read(path.join(PARTIALS_DIR, "footer.html"));
  const content = read(path.join(PAGES_DIR, page.contentFile));

  // The 404 page is served by Vercel for any unmatched URL (e.g. old indexed
  // links like /portafolio or /contactenos), often several path segments deep.
  // A relative ROOT would then resolve assets against that broken URL, so this
  // page alone must use an absolute, domain-root-relative prefix.
  const root = page.key === "404" ? "/" : rootPrefix(page.outDir);
  const nav = buildNav(page.key);

  let html = head + header + content + footer;

  html = html
    .split("{{TITLE}}").join(page.title)
    .split("{{DESCRIPTION}}").join(page.description)
    .split("{{NAV_LINKS}}").join(nav)
    .split("{{ROOT}}").join(root);

  return html;
}

function writePage(page) {
  const html = assemble(page);
  const outDir = path.join(OUT_DIR, page.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, page.outFile || "index.html");
  fs.writeFileSync(outFile, html, "utf8");
  console.log("built:", path.relative(OUT_DIR, outFile));
}

// Clean output dir, then rebuild
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// Copy static assets as-is
fs.cpSync(path.join(PROJECT_DIR, "assets"), path.join(OUT_DIR, "assets"), { recursive: true });

PAGES.forEach(writePage);
console.log(`\n${PAGES.length} páginas generadas en /dist.`);
