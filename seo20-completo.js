const fs = require('fs');
const path = require('path');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');
const generarPDFConHTML = require('./pdf-generator');
const ejecutarScraping = require('./generar-scrapping-funcional');
const puppeteer = require('puppeteer');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function ejecutarLighthouse(url, carpeta) {
  const { default: lighthouse } = await import('lighthouse');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--remote-debugging-port=9222'],
    executablePath: puppeteer.executablePath()
  });

  const endpoint = new URL(browser.wsEndpoint());
  const port = endpoint.port;

  try {
    const result = await lighthouse(url, {
      port,
      output: 'json',
      logLevel: 'info',
      onlyCategories: ['seo', 'performance'] // ⚡ más rápido y liviano
    });

    const outputPath = path.join(carpeta, 'lighthouse.json');
    fs.writeFileSync(outputPath, result.report);
    console.log(`📊 Lighthouse guardado en: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error ejecutando Lighthouse:', error);
  } finally {
    await browser.close();
  }
}

(async () => {
  const url = process.argv[2];

  if (!url || !url.startsWith('http')) {
    console.error('❌ Debes proporcionar una URL válida como argumento.');
    process.exit(1);
  }

  console.log('📥 Iniciando scraping...');
  await ejecutarScraping(url);
  console.log('✅ Scraping completado.');

  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  const scrapingPath = path.join(carpeta, 'scraping.txt');
  let textoScraping = '';

  if (fs.existsSync(scrapingPath)) {
    textoScraping = fs.readFileSync(scrapingPath, 'utf-8').trim();
  }

  // 🔹 Ejecutar Lighthouse
  await ejecutarLighthouse(url, carpeta);

  // 🔹 Generar informe
  const { homeResult } = await generarInformeUnificadoCompleto({
    url,
    textoScraping
  });

  const homeResultHTML = homeResult
    .map(b => `<h3>${b.titulo}</h3>\n${b.contenido}`)
    .join('\n');

  // 🔹 Cargar otras secciones si existen
  const recomendacionesPath = path.join(carpeta, 'recomendaciones.html');
  const sitemapPath = path.join(carpeta, 'sitemap-analysis.html');
  const urlsPath = path.join(carpeta, 'analisis-por-url.html');
  const erroresPath = path.join(carpeta, 'urls-con-errores.html');

  const recomendacionesHTML = fs.existsSync(recomendacionesPath) ? fs.readFileSync(recomendacionesPath, 'utf-8') : '';
  const sitemapHTML = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf-8') : '';
  const urlsPorPaginaHTML = fs.existsSync(urlsPath) ? fs.readFileSync(urlsPath, 'utf-8') : '';
  const erroresHTML = fs.existsSync(erroresPath) ? fs.readFileSync(erroresPath, 'utf-8') : '';

  const informePath = path.join(carpeta, 'informe-seo-final.pdf');

  await generarPDFConHTML({
    sitio: dominio,
    fecha,
    lighthouseScoresHTML: '',
    coreWebVitalsHTML: '',
    homeResultHTML,
    recomendacionesHTML,
    sitemapHTML,
    urlsPorPaginaHTML,
    erroresHTML,
    outputPath: informePath
  });

  // También se copia a una ruta simple
  const copiaPath = path.join(__dirname, 'resultados', 'informe-seo.pdf');
  fs.copyFileSync(informePath, copiaPath);
  console.log(`📎 Copia del informe disponible en: ${copiaPath}`);

  console.log(`🎉 Informe PDF final generado: ${informePath}`);
})();
 