const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generarPDFDesdePlantilla({
  sitio,
  fecha,
  lighthouseScores,
  coreWebVitals,
  homeResult,
  recomendaciones,
  sitemap,
  urlsPorPagina,
  errores404,
  outputPdfPath
}) {
  const plantillaHtml = fs.readFileSync(path.join(__dirname, 'plantillas', 'plantilla-informe.html'), 'utf-8');

  const html = plantillaHtml
    .replace(/{{sitio}}/g, sitio)
    .replace(/{{fecha}}/g, fecha)
    .replace('{{lighthouseScores}}', marked.parse(lighthouseScores || ''))
    .replace('{{coreWebVitals}}', marked.parse(coreWebVitals || ''))
    .replace('{{homeResult}}', marked.parse(homeResult || ''))
    .replace('{{recomendaciones}}', marked.parse(recomendaciones || ''))
    .replace('{{sitemap}}', marked.parse(sitemap || ''))
    .replace('{{urlsPorPagina}}', marked.parse(urlsPorPagina || ''))
    .replace('{{errores404}}', marked.parse(errores404 || ''));

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '30px', bottom: '30px', left: '40px', right: '40px' }
  });

  await browser.close();
  console.log(`✅ PDF generado con plantilla final en: ${outputPdfPath}`);
}

module.exports = generarPDFDesdePlantilla;
