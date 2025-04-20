const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const analyzer = require('seo-analyzer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Crear carpeta de resultados si no existe
const resultadosPath = path.join(__dirname, 'resultados');
if (!fs.existsSync(resultadosPath)) fs.mkdirSync(resultadosPath);

// Leer URL desde stdin
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
console.log('🔍 Ingresa la URL del sitio:');
rl.on('line', async (url) => {
  try {
    console.log('🌐 URL recibida:', url);

    // 1. Screenshot con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('📸 Capturando screenshot del home...');
    const screenshotPath = path.join(resultadosPath, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();

    // 2. Lighthouse desde Node.js directamente
    console.log('⚙️ Ejecutando Lighthouse...');
    const chromePath = puppeteer.executablePath();
    const chrome = await chromeLauncher.launch({
      chromePath,
      chromeFlags: ['--no-sandbox']
    });

    const lhResultPath = path.join(resultadosPath, 'lh-report.json');
    const lhOptions = {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['seo']
    };

    const lhRunnerResult = await lighthouse(url, lhOptions);
    const lhJson = lhRunnerResult.report;
    fs.writeFileSync(lhResultPath, lhJson);
    const seoScore = lhRunnerResult.lhr.categories.seo.score * 100;

    await chrome.kill();

    // 3. Análisis con seo-analyzer
    console.log('🔍 Ejecutando seo-analyzer...');
    const analysis = await analyzer({ url });

    // 4. Generar PDF
    console.log('📝 Generando PDF...');
    const pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage();
    const { width, height } = page1.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page1.drawText('Informe SEO', {
      x: 50, y: height - 60, size: 24, font, color: rgb(0.2, 0.4, 0.8)
    });

    page1.drawText(`Sitio analizado: ${url}`, {
      x: 50, y: height - 100, size: 14, font
    });

    page1.drawText(`Puntaje SEO (Lighthouse): ${seoScore}`, {
      x: 50, y: height - 130, size: 14, font
    });

    const outputPath = path.join(resultadosPath, 'informe-seo.pdf');
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('✅ Informe generado:', outputPath);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err.message || err);
    process.exit(1);
  }
});
