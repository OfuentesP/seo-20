#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const scrape = require('./scrape-text');
const screenshot = require('./screenshot');
const analizarCompetenciaPorKeywords = require('./keyword-competencia');
const generatePdfFromMd = require('./utils/pdf-generator');
const axios = require('axios');
const cheerio = require('cheerio');

// Pedir la URL
const url = prompt('🔍 Ingresa la URL que quieres analizar: ').trim();
if (!url.startsWith('http')) {
  console.error('❌ URL inválida. Debe comenzar con http o https.');
  process.exit(1);
}

// Crear carpeta destino
const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
fs.mkdirSync(folderName, { recursive: true });

console.log('\n🔄 [0%] Iniciando análisis SEO para:', url);

(async () => {
  try {
    // Lighthouse
    console.log('🔧 [10%] Ejecutando Lighthouse...');
    execSync(`lighthouse ${url} --output json --output-path=${folderName}/report.json --only-categories=seo --chrome-flags="--headless"`);

    // Scraping de texto
    console.log('🔧 [40%] Scrapeando contenido visible...');
    await scrape(url, `${folderName}/texto-visible.txt`);

    // Screenshot
    console.log('🔧 [60%] Tomando screenshot...');
    await screenshot(url, `${folderName}/screenshot.png`);

    // Análisis de competencia por keywords
    console.log('🔧 [75%] Analizando competencia por palabras clave...');
    await analizarCompetenciaPorKeywords(`${folderName}/texto-visible.txt`, `${folderName}/competencia-keywords.md`);

    // Informe de recomendaciones
    console.log('🧾 [80%] Generando recomendaciones...');
    const recomendacionesMd = `
# 🧠 Recomendaciones SEO para: ${url}

_Fecha de análisis: ${new Date().toISOString().slice(0, 10)}_

---

## 🧩 Recomendaciones SEO por zonas visuales

| Zona visual         | Qué se muestra (visual)                          | ¿Está en el texto visible/HTML? | Oportunidades SEO                                                                 |
|---------------------|--------------------------------------------------|-------------------------------|------------------------------------------------------------------------------------|
| Hero / Banner       | Imagen con frase “New Arrivals”                 | ❌                             | Agregar \`<h1>\` y descripción con keywords relevantes + CTA con texto ancla útil   |
| Categoría destacada | Productos como “Silla oficina Vivid”, etc.      | ✅ parcial                     | Incluir encabezado semántico \`<h2>\` + texto descriptivo con intención de búsqueda |
| Carrusel de ofertas | Ofertas con % de descuento                      | ❌                             | Añadir texto HTML debajo con características destacadas, títulos visibles         |
| Marcas destacadas   | Logos e imágenes de Tempur, Kare                | ❌                             | Añadir texto HTML con descripción y enlaces a landing SEO específicas             |
| Footer / Tiendas    | Imágenes de tiendas físicas                     | ❌                             | Añadir nombre, dirección y schema.org \`LocalBusiness\` para SEO local              |
`;
    const mdPath = path.join(folderName, 'recomendaciones.md');
    fs.writeFileSync(mdPath, recomendacionesMd);
    await generatePdfFromMd(mdPath, path.join(folderName, 'recomendaciones.pdf'));

    // Informe técnico
    console.log('🧾 [85%] Generando informe técnico...');
    await generateTechnicalReport(`${folderName}/report.json`, folderName);

    // Sitemap
    console.log('🔧 [90%] Analizando sitemap.xml...');
    await analizarSitemap(url, path.join(folderName, 'sitemap-analysis.md'));

    await generatePdfFromMd(
      path.join(folderName, 'sitemap-analysis.md'),
      path.join(folderName, 'sitemap-analysis.pdf')
    );
    
    // Final
    console.log('\n✅ [100%] Análisis completo. Abriendo carpeta de resultados...');
    exec(`start "" "${path.resolve(folderName)}"`);

  } catch (err) {
    console.error('❌ Error en la ejecución:', err.message);
  }
})();

// Función: informe técnico
async function generateTechnicalReport(reportPath, outputFolder) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const date = new Date().toISOString().slice(0, 10);
  const audits = report.audits;
  const categories = report.categories;

  let md = `# 🧪 Informe Técnico SEO – ${report.finalUrl || 'Sitio Analizado'}\n\n`;
  md += `_Fecha: ${date}_\n\n---\n\n## Resumen de categorías Lighthouse\n\n`;
  md += `| Categoría         | Puntaje |\n|-------------------|---------|\n`;
  for (const key in categories) {
    const score = categories[key].null != null ? `${Math.round(categories[key].score * 100)} / 100` : 'N/A';
    md += `| ${categories[key].title} | ${score} |\n`;
  }

  md += `\n---\n\n## Principales problemas y oportunidades de mejora\n`;

  const issues = Object.values(audits).filter(a => a.score !== 1 && a.scoreDisplayMode !== 'notApplicable');
  issues.forEach((item) => {
    const title = item.title || '';
    const desc = item.description || '';
    const explanation = item.explanation || '';
    const score = item.score !== null ? Math.round(item.score * 100) : 'N/A';

    md += `\n### 🔧 ${title} (${score}/100)\n`;
    md += `- **Explicación técnica:** ${explanation || desc}\n`;

    const simpleExplanation = title.includes("paint") ?
      "La página demora en mostrar contenido. Esto puede afectar la experiencia del usuario." :
      title.includes("meta") ?
      "Faltan textos clave que ayudan a que Google entienda de qué trata la página." :
      title.includes("accesibilidad") ?
      "Algunas personas podrían tener dificultades para navegar este sitio." :
      "Este punto afecta el rendimiento, la visibilidad o la accesibilidad del sitio.";

    md += `- **Explicación no técnica:** ${simpleExplanation}\n`;
  });

  const mdPath = path.join(outputFolder, 'reporte-tecnico.md');
  fs.writeFileSync(mdPath, md);
  await generatePdfFromMd(mdPath, path.join(outputFolder, 'reporte-tecnico.pdf'));
}

// Función: análisis de sitemap
async function analizarSitemap(siteUrl, outputPath) {
  const sitemapUrl = siteUrl.endsWith('/') ? siteUrl + 'sitemap.xml' : siteUrl + '/sitemap.xml';
  let md = `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n\n`;

  try {
    const res = await axios.get(sitemapUrl, { timeout: 10000 });
    const $ = cheerio.load(res.data, { xmlMode: true });

    md += `✅ El sitemap está accesible y retornó código 200.\n\n`;

    const urls = $('url');
    const total = urls.length;
    md += `✅ Sitemap simple con **${total}** URLs detectadas.\n\n`;

    const fechas = urls.map((i, el) => $(el).find('lastmod').text()).get().filter(Boolean);
    const ultimaFecha = fechas.length > 0 ? fechas.sort().reverse()[0] : 'No disponible';
    md += `🕒 Última fecha de modificación encontrada: **${ultimaFecha}**\n\n`;

    md += `## 📌 Recomendaciones SEO Generales\n`;
    md += `- Asegúrate de que todas las URLs listadas estén activas y no respondan con error 404 o redirecciones innecesarias.\n`;
    md += `- Revisa que se incluyan las páginas estratégicas del negocio (ej: productos, categorías, contenido).\n`;
    md += `- Valida que las URLs canónicas correspondan con las del sitemap.\n`;
    md += `- Aprovecha \`<lastmod>\` para ayudar a Google a priorizar rastreo.\n\n`;

    const secciones = {};
    const urlsBySection = {};

    urls.each((_, el) => {
      const loc = $(el).find('loc').text();
      const path = loc.replace(siteUrl, '').split('/')[1] || 'home';

      secciones[path] = (secciones[path] || 0) + 1;
      if (!urlsBySection[path]) urlsBySection[path] = [];
      urlsBySection[path].push(loc);
    });

    md += `## 🧩 Secciones más representadas:\n`;
    for (const [sec, count] of Object.entries(secciones).sort((a, b) => b[1] - a[1])) {
      md += `- \`${sec}\`: ${count} URLs\n`;
    }

    md += `\n## 📄 Listado completo de URLs por sección:\n`;
    for (const [sec, urls] of Object.entries(urlsBySection).sort((a, b) => b[1].length - a[1].length)) {
      md += `\n### Sección: \`${sec}\` (${urls.length})\n`;
      urls.forEach(u => {
        md += `- ${u}\n`;
      });
    }
    fs.writeFileSync(outputPath, md);
  } catch (err) {
    fs.writeFileSync(outputPath, `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n\n❌ No se pudo acceder al sitemap: ${err.message}`);
  }
}
