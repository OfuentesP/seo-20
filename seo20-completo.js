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
const analizarMetadatos = require('./analizar-metadatos');
const analizarMetadatosEnriquecidos = require('./metadatos-enriquecidos');
const generarInsightsIA = require('./generar-insights-ai');
const puppeteer = require('puppeteer');

(async () => {
  const url = prompt('🔍 Ingresa la URL del sitio: ').trim();
  if (!url.startsWith('http')) return console.error('❌ URL inválida.');

  const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
  const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
  fs.mkdirSync(folderName, { recursive: true });

  // Guardar sitemap.xml (si existe)
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

  // Puppeteer screenshot (como validación visual)
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(folderName, 'home.png'), fullPage: true });
    await browser.close();
  } catch (err) {
    console.warn('⚠️ Error al capturar el Home:', err.message);
  }

  // Lighthouse + scraping
  try {
    execSync(`lighthouse ${url} --output json --output-path=${path.join(folderName, 'report.json')} --only-categories=seo --chrome-flags="--headless"`);
  } catch (err) {
    console.warn('⚠️ Lighthouse falló en el home');
  }

  try {
    await scrape(url, path.join(folderName, 'texto-visible.txt'));
  } catch (err) {
    console.warn('⚠️ Scraping falló');
  }

  // Análisis sitemap (usando Sitemapper + verificación de 404)
  const sitemapData = await analizarSitemapConSitemapper(url);
  const urlsAAnalizar = sitemapData.urls || [];
  const urls404Sitemap = await detectarUrls404(urlsAAnalizar);

  const sitemapResumen = {
    total: urlsAAnalizar.length,
    conTest: urlsAAnalizar.filter(u => u.includes('test')).length,
    conPrueba: urlsAAnalizar.filter(u => u.includes('prueba')).length,
    conError404: urls404Sitemap.length
  };

  const sitemapMdString = urlsAAnalizar.length > 0 ? `Se detectaron ${sitemapResumen.total} URLs en el sitemap de ${url}.

**Resumen:**
- Contienen 'test': ${sitemapResumen.conTest}
- Contienen 'prueba': ${sitemapResumen.conPrueba}
- Devuelven error 404: ${sitemapResumen.conError404}` : '';

  // Análisis del Home
  const homeReportPath = path.join(folderName, 'report.json');
  const homeTextPath = path.join(folderName, 'texto-visible.txt');
  let homeLighthouse = fs.existsSync(homeReportPath) ? JSON.parse(fs.readFileSync(homeReportPath, 'utf-8')) : null;
  let homeScraping = fs.existsSync(homeTextPath) ? fs.readFileSync(homeTextPath, 'utf-8') : '';
  let secciones = analizarSeccionesSeo(homeTextPath);
  let metadatos = analizarMetadatos(homeTextPath);
  let enrichedMeta = await analizarMetadatosEnriquecidos(url);
  let insightsIA = await generarInsightsIA({ lighthouse: homeLighthouse, scraping: homeScraping });

  const informeFinalMd = await generarInformeUnificadoCompleto({
    sitio: url,
    fecha: new Date().toISOString().slice(0, 10),
    homeResult: { lighthouse: homeLighthouse, scraping: homeScraping, secciones, metadatos, enriched: enrichedMeta },
    sitemapMd: sitemapMdString,
    paginas: [],
    urls404: urls404Sitemap,
    sitemapTotal: sitemapResumen.total,
    sitemapLastmod: sitemapData.ultimaFechaModificacion,
    insightsIA
  });

  const mdFinalPath = path.join(folderName, 'informe-seo-final.md');
  fs.writeFileSync(mdFinalPath, informeFinalMd);
  await generatePdfFromMd(mdFinalPath, path.join(folderName, 'informe-seo-final.pdf'));
  fs.unlinkSync(mdFinalPath);

  console.log(`\n✅ Informe generado: ${path.join(folderName, 'informe-seo-final.pdf')}`);
})();