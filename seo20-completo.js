
const generarInformeUnificadoCompleto = require('./generar-informe-unificado');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const scrape = require('./scrape-text');
const generatePdfFromMd = require('./utils/pdf-generator');
const extraerUrlsSitemap = require('./extraer-urls-sitemap');
const analizarSeccionesSeo = require('./analizar-secciones-seo');
const analizarResumenSitemap = require('./analizar-sitemap-resumen');
const puppeteer = require('puppeteer');

(async () => {
  const url = prompt('🔍 Ingresa la URL del sitio: ').trim();
  if (!url.startsWith('http')) {
    console.error('❌ URL inválida. Debe comenzar con http o https.');
    return;
  }

  const urlsAAnalizar = await extraerUrlsSitemap(url, 'principales');
  const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
  const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
  fs.mkdirSync(folderName, { recursive: true });

  // 1. Captura del Home
  console.log(`\n📸 Capturando imagen del Home: ${url}`);
  try {
    const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Screenshot omitido del guardado físico
    await page.screenshot({ path: '/dev/null', fullPage: true });
    await browser.close();
  } catch (err) {
    console.warn('⚠️ Error al capturar la imagen del home');
  }

  // 2. Análisis Lighthouse del Home
  console.log(`\n🏠 Analizando el Home con Lighthouse`);
  try {
    execSync(`lighthouse ${url} --output json --output-path=${path.join(folderName, 'report.json')} --only-categories=seo --chrome-flags="--headless"`);
  } catch (err) {
    console.warn('⚠️ Lighthouse falló en el home');
  }

  // 3. Scraping del Home
  try {
    await scrape(url, path.join(folderName, 'texto-visible.txt'));
  } catch (err) {
    console.warn('⚠️ Scraping falló en el home');
  }

  // 4. Cargar análisis
  const sitemapResumen = await analizarResumenSitemap(urlsAAnalizar);
  const sitemapMdString = `Se detectaron ${sitemapResumen.total} URLs en el sitemap de ${url}.\n\n` +
    `**Resumen:**\n` +
    `- Contienen 'test': ${sitemapResumen.conTest}\n` +
    `- Contienen 'prueba': ${sitemapResumen.conPrueba}\n` +
    `- Devuelven error 404: ${sitemapResumen.conError404}\n`;
  const homeReportPath = path.join(folderName, 'report.json');
  const homeTextPath = path.join(folderName, 'texto-visible.txt');

  let homeLighthouse = null;
  let homeScraping = '';
  let secciones = [];

  if (fs.existsSync(homeReportPath)) {
    homeLighthouse = JSON.parse(fs.readFileSync(homeReportPath, 'utf-8'));
  }
  if (fs.existsSync(homeTextPath)) {
    homeScraping = fs.readFileSync(homeTextPath, 'utf-8');
    secciones = analizarSeccionesSeo(homeTextPath);
  }

  // 5. Generar informe
  let informeFinalMd = await generarInformeUnificadoCompleto({
    sitio: url,
    fecha: new Date().toISOString().slice(0, 10),
    homeResult: {
      lighthouse: homeLighthouse,
      scraping: homeScraping,
      secciones: secciones
    },
    sitemapMd: sitemapMdString,
    paginas: [],
    urls404: []
  });

  const mdFinalPath = path.join(folderName, 'informe-seo-final.md');
  informeFinalMd = informeFinalMd
    .replace('{TOTAL}', sitemapResumen.total)
    .replace('{TEST}', sitemapResumen.conTest)
    .replace('{PRUEBA}', sitemapResumen.conPrueba)
    .replace('{ERROR404}', sitemapResumen.conError404);
  fs.writeFileSync(mdFinalPath, informeFinalMd);
  await generatePdfFromMd(mdFinalPath, path.join(folderName, 'informe-seo-final.pdf'));
  fs.unlinkSync(mdFinalPath);

  console.log(`\n✅ Informe generado: ${path.join(folderName, 'informe-seo-final.pdf')}`);
})();
