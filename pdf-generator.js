const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Función para reemplazar placeholders tipo {{nombre}} en el HTML
function renderHTML(template, variables) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return variables[key.trim()] || '';
  });
}

module.exports = async function generarPDFConHTML({
  sitio,
  fecha,
  homeResultHTML,
  recomendacionesHTML,
  sitemapHTML,
  urlsPorPaginaHTML,
  erroresHTML,
  outputPath
}) {
  const plantillaPath = path.join(__dirname, 'plantillas', 'plantilla-informe.html');
  const htmlBase = fs.readFileSync(plantillaPath, 'utf-8');

  const finalHTML = renderHTML(htmlBase, {
    sitio,
    fecha,
    homeResult: homeResultHTML,
    recomendaciones: recomendacionesHTML,
    sitemap: sitemapHTML,
    urlsPorPagina: urlsPorPaginaHTML,
    errores404: erroresHTML
  });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();

  console.log('✅ PDF generado con plantilla HTML en:', outputPath);
};
