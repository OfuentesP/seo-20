
const generarInformeUnificadoCompleto = require('./generar-informe-unificado');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const scrape = require('./scrape-text');
const generatePdfFromMd = require('./utils/pdf-generator');
const analizarSitemapConSitemapper = require('./analizar-sitemap-sitemapper');
const detectarUrls404 = require('./detectar-urls-404');
const analizarSeccionesSeo = require('./analizar-secciones-seo');
const analizarResumenSitemap = require('./analizar-sitemap-resumen');
const analizarMetadatos = require('./analizar-metadatos');
const analizarMetadatosEnriquecidos = require('./metadatos-enriquecidos');
const puppeteer = require('puppeteer');

(async () => {
  const url = prompt('🔍 Ingresa la URL del sitio: ').trim();
  if (!url.startsWith('http')) {
    console.error('❌ URL inválida. Debe comenzar con http o https.');
    return;
  }

  const sitemapData = await analizarSitemapConSitemapper(url);
  const urlsAAnalizar = sitemapData.urls;
const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
fs.mkdirSync(folderName, { recursive: true });
fs.mkdirSync(folderName, { recursive: true });
  const sitemapPath = path.join(folderName, 'sitemap.xml');
  try {
    const response = await fetch(`${url}/sitemap.xml`);
    if (response.ok) {
      const xmlOriginal = await response.text();
      fs.writeFileSync(sitemapPath, xmlOriginal);
    }
  } catch (err) {
    console.warn('⚠️ No se pudo guardar el sitemap.xml:', err.message);
  }
  fs.mkdirSync(folderName, { recursive: true });

  // Captura del Home (opcional solo como validación)
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 900 } });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.82 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: '/dev/null', fullPage: true });
    await browser.close();
  } catch (err) {
    console.warn('⚠️ Error al capturar el Home:', err.message);
  }

  // Análisis Lighthouse
  try {
    execSync(`lighthouse ${url} --output json --output-path=${path.join(folderName, 'report.json')} --only-categories=seo --chrome-flags="--headless"`);
  } catch (err) {
    console.warn('⚠️ Lighthouse falló en el home');
  }

  // Scraping
  try {
    await scrape(url, path.join(folderName, 'texto-visible.txt'));
  } catch (err) {
    console.warn('⚠️ Scraping falló en el home');
  }

    const urls404Sitemap = await detectarUrls404(urlsAAnalizar);

  // Usando sitemapper para totales y fechas
  const sitemapResumen = {
    total: sitemapData.total,
    conTest: urlsAAnalizar.filter(u => u.includes('test')).length,
    conPrueba: urlsAAnalizar.filter(u => u.includes('prueba')).length,
    conError404: urls404Sitemap.length
  };

  let sitemapTotal = urlsAAnalizar.length;
  let sitemapLastmod = '';
  try {
    const xml = fs.readFileSync(path.join(folderName, 'sitemap.xml'), 'utf8');
    const match = xml.match(/<lastmod>(.*?)<\/lastmod>/);
    if (match) sitemapLastmod = match[1];
  } catch (err) {
    console.warn('⚠️ No se pudo leer sitemap.xml para detectar <lastmod>');
  }

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
  let metadatos = [];

  if (fs.existsSync(homeReportPath)) {
    homeLighthouse = JSON.parse(fs.readFileSync(homeReportPath, 'utf-8'));
  }
  if (fs.existsSync(homeTextPath)) {
    homeScraping = fs.readFileSync(homeTextPath, 'utf-8');
    secciones = analizarSeccionesSeo(homeTextPath);
    metadatos = analizarMetadatos(homeTextPath);
    enrichedMeta = await analizarMetadatosEnriquecidos(url);
  }

  let informeFinalMd = await generarInformeUnificadoCompleto({
    sitio: url,
    fecha: new Date().toISOString().slice(0, 10),
    homeResult: {
      lighthouse: homeLighthouse,
      scraping: homeScraping,
      secciones: secciones,
      metadatos: metadatos,
      enriched: enrichedMeta
    },
    sitemapMd: sitemapMdString,
    paginas: [],
    urls404: urls404Sitemap,
    sitemapTotal: sitemapTotal,
    sitemapLastmod: sitemapData.ultimaFechaModificacion
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