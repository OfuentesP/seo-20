// seo20-completo.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const readline = require('readline');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');

const resultadosPath = path.join(__dirname, 'resultados');
if (!fs.existsSync(resultadosPath)) fs.mkdirSync(resultadosPath);

const rl = readline.createInterface({ input: process.stdin });
console.log('🔍 Ingresa la URL del sitio:');

rl.on('line', async (url) => {
  try {
    console.log('🌐 URL recibida:', url);

    // Lanzar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('📸 Capturando screenshot del home...');
    const screenshotPath = path.join(resultadosPath, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Ejecutar Lighthouse desde Puppeteer
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

    // Generar PDF final consolidado
    console.log('📄 Generando informe PDF completo...');
    const outputPath = path.join(resultadosPath, 'informe-seo.pdf');
    await generarInformeUnificadoCompleto({
      url,
      jsonPath: lhResultPath,
      outputPath
    });

    console.log('✅ Informe final listo:', outputPath);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err.message || err);
    process.exit(1);
  }
});
