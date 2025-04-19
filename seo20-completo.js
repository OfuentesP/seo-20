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
const fetch = require('node-fetch');

(async () => {
  const url = prompt('🔍 Ingresa la URL del sitio: ').trim();
  if (!url.startsWith('http')) return console.error('❌ URL inválida.');

  const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
  const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
  fs.mkdirSync(folderName, { recursive: true });

  // Intentar guardar sitemap.xml si existe
  let sitemapLastmod = '';
  let sitemapTotal = 0;
  let sitemapMdString = '';
  let urlsAAnalizar = [];

  try {
    const response = await fetch(`${url}/sitemap.xml`);
    if (response.ok) {
      const xmlOriginal = await response.text();
      fs.writeFileSync(path.join(folderName, 'sitemap.xml'), xmlOriginal);

      // Análisis de URLs con Sitemapper
      const sitemapData = await analizarSitemapConSitemapper(url);
      urlsAAnalizar = sitemapData.urls || [];
      sitemapTotal = sitemapData.total || urlsAAnalizar.length;

      const match = xmlOriginal.match(/<lastmod>(.*?)<\/lastmod>/);
      if (match) sitemapLastmod = match[1];

      const urls404Sitemap = await detectarUrls404(urlsAAnalizar);

      sitemapMdString = `Se detectaron ${sitemapTotal} URLs en el sitemap de ${url}.\n\n` +
        `**Resumen:**\n` +
        `- Contienen 'test': ${urlsAAnalizar.filter(u => u.includes('test')).length}\n` +
        `- Contienen 'prueba': ${urlsAAnalizar.filter(u => u.includes('prueba')).length}\n` +
        `- Devuelven error 404: ${urls404Sitemap.length}`;
    }
  } catch (err) {
    console.warn('⚠️ No se pudo guardar o analizar el sitemap.xml:', err.message);
  }

  // Captura visual del home
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

  // Análisis con Lighthouse
  try {
    execSync(`lighthouse ${url} --output json --output-path=${path.join(folderName, 'report.json')} --only-categories=seo,performance,accessibility --chrome-flags="--headless"`);
  } catch (err) {
    console.warn('⚠️ Lighthouse falló en el home');
  }

  // Scraping
  try {
    await scrape(url, path.join(folderName, 'texto-visible.txt'));
  } catch (err) {
    console.warn('⚠️ Scraping falló');
  }

  // Cargar datos del análisis
  const homeReportPath = path.join(folderName, 'report.json');
  const homeTextPath = path.join(folderName, 'texto-visible.txt');

  const homeLighthouse = fs.existsSync(homeReportPath) ? JSON.parse(fs.readFileSync(homeReportPath, 'utf-8')) : null;
  const homeScraping = fs.existsSync(homeTextPath) ? fs.readFileSync(homeTextPath, 'utf-8') : '';
  const secciones = analizarSeccionesSeo(homeTextPath);
  const metadatos = analizarMetadatos(homeTextPath);
  const enrichedMeta = await analizarMetadatosEnriquecidos(url);

  const insightsIA = await generarInsightsIA({
    lighthouse: homeLighthouse,
    scraping: homeScraping
  });

  const informeFinalMd = await generarInformeUnificadoCompleto({
    sitio: url,
    fecha: new Date().toISOString().slice(0, 10),
    homeResult: {
      lighthouse: homeLighthouse,
      scraping: homeScraping,
      secciones,
      metadatos,
      enriched: enrichedMeta
    },
    sitemapMd: sitemapMdString,
    paginas: [],
    urls404: [], // los errores 404 individuales no se listan, solo cuentan
    sitemapTotal,
    sitemapLastmod,
    insightsIA
  });

  const mdFinalPath = path.join(folderName, 'informe-seo-final.md');
  fs.writeFileSync(mdFinalPath, informeFinalMd);
  await generatePdfFromMd(mdFinalPath, path.join(folderName, 'informe-seo-final.pdf'));
  fs.unlinkSync(mdFinalPath);

  console.log(`\n✅ Informe generado: ${path.join(folderName, 'informe-seo-final.pdf')}`);
})();
