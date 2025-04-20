// seo20-completo.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const readline = require('readline');
const markdownIt = require('markdown-it');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');

const resultadosPath = path.join(__dirname, 'resultados');
if (!fs.existsSync(resultadosPath)) fs.mkdirSync(resultadosPath);

const rl = readline.createInterface({ input: process.stdin });
console.log('🔍 Ingresa la URL del sitio:');

rl.on('line', async (url) => {
  try {
    console.log('🌐 URL recibida:', url);

    // Lanzar Puppeteer para análisis y captura
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

    console.log('📸 Capturando screenshot del home...');
    const screenshotPath = path.join(resultadosPath, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Ejecutar Lighthouse
    console.log('⚙️ Ejecutando Lighthouse...');
    const lighthouse = (await import('lighthouse')).default;
    const wsEndpoint = browser.wsEndpoint();
    const browserURL = wsEndpoint.replace('ws://', 'http://').replace('/devtools/browser', '');
    const lhResultPath = path.join(resultadosPath, 'lh-report.json');

    const result = await lighthouse(url, {
      port: new URL(browserURL).port,
      output: 'json',
      onlyCategories: ['seo']
    });

    fs.writeFileSync(lhResultPath, result.report);
    await browser.close();

    // Generar contenido HTML desde plantilla
    console.log('📄 Generando informe con plantilla HTML...');
    const plantillaPath = path.join(__dirname, 'plantillas', 'plantilla-informe.html');
    const htmlBase = fs.readFileSync(plantillaPath, 'utf8');

    const fechaActual = new Date().toISOString().split('T')[0];
    const homeResult = { lighthouse: result.lhr };
    const md = generarInformeUnificadoCompleto({
      homeResult,
      sitemapMd: '',
      paginas: [],
      urls404: [],
      sitio: url,
      fecha: fechaActual,
      sitemapTotal: 0,
      sitemapLastmod: null,
      insightsIA: null
    });

    const secciones = md.split('\n---\n');
    const mdToHtml = (txt) => markdownIt().render(txt || '');

    const htmlFinal = htmlBase
      .replace(/{{sitio}}/g, url)
      .replace(/{{fecha}}/g, fechaActual)
      .replace(/{{home}}/g, mdToHtml(secciones[0]))
      .replace(/{{rendimiento}}/g, mdToHtml(secciones[1]))
      .replace(/{{tecnico}}/g, mdToHtml(secciones[2]))
      .replace(/{{palabras}}/g, mdToHtml(secciones[3]))
      .replace(/{{zonas}}/g, mdToHtml(secciones[4]))
      .replace(/{{sitemap}}/g, mdToHtml(secciones[5]))
      .replace(/{{metadatos}}/g, mdToHtml(secciones[6]))
      .replace(/{{insights}}/g, mdToHtml(secciones[7]));

    // Generar PDF final
    const browser2 = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page2 = await browser2.newPage();
    await page2.setContent(htmlFinal, { waitUntil: 'load' });
    await page2.pdf({ path: path.join(resultadosPath, 'informe-seo.pdf'), format: 'A4' });
    await browser2.close();

    console.log('✅ Informe final listo:', path.join(resultadosPath, 'informe-seo.pdf'));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err.message || err);
    process.exit(1);
  }
});
