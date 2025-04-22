const fs = require('fs');
const path = require('path');
const { analizarSitemap } = require('../../analizar-sitemap');
const analizarResumenSitemap = require('../../analizar-sitemap-resumen');
const procesarSitemapIndex = require('./procesar-index');
const generarPDFdesdeHTML = require('../lighthouse/exportar-pdf');

async function generarReporteSitemap(siteUrl, carpetaResultados) {
  const outputPdf = path.join(carpetaResultados, 'sitemap.pdf');
  const htmlOutput = path.join(carpetaResultados, 'sitemap.html');

  const sitemapUrl = siteUrl.endsWith('/') ? siteUrl + 'sitemap.xml' : siteUrl + '/sitemap.xml';

  let markdown = await analizarSitemap(siteUrl);

  // Chequear errores 404 si existen
  const erroresPath = path.join(carpetaResultados, 'errores-404.json');
  let totalErrores404 = 0;

  if (fs.existsSync(erroresPath)) {
    const errores = JSON.parse(fs.readFileSync(erroresPath, 'utf-8'));
    totalErrores404 = errores.length;
    markdown += `\n❗ Se detectaron **${totalErrores404}** URLs con error 404.\n`;
  } else {
    markdown += `\n⚠ No se encontró el archivo errores-404.json.\n`;
  }

  // Convertir markdown a HTML básico
  let html = `
    <html>
      <head>
        <title>Análisis Técnico del Sitemap</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1, h2, h3 { color: #2c3e50; }
          pre { background: #f4f4f4; padding: 10px; white-space: pre-wrap; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>🗺 Análisis Técnico del Sitemap</h1>
        <pre>${markdown}</pre>
  `;

  // Si es un sitemap index, analizamos sus sub-sitemaps
  if (markdown.includes('<sitemapindex')) {
    const subSitemapHTML = await procesarSitemapIndex(sitemapUrl);
    html += subSitemapHTML;
  }

  html += `
      </body>
    </html>
  `;

  fs.writeFileSync(htmlOutput, html, 'utf-8');
  await generarPDFdesdeHTML(html, outputPdf);

  return {
    html,
    pdf: outputPdf,
    htmlPath: htmlOutput,
  };
}

module.exports = generarReporteSitemap;
