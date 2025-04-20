const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const analyzer = require('seo-analyzer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Crear carpeta de resultados
const resultadosPath = path.join(__dirname, 'resultados');
if (!fs.existsSync(resultadosPath)) fs.mkdirSync(resultadosPath);

// Leer URL desde stdin
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
console.log('🔍 Ingresa la URL del sitio:');
rl.on('line', async (url) => {
  try {
    console.log('🌐 URL recibida:', url);

    // 1. Lanzar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('📸 Capturando screenshot del home...');
    const screenshotPath = path.join(resultadosPath, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // 2. Conectar Lighthouse a Puppeteer
    console.log('⚙️ Ejecutando Lighthouse...');
    const wsEndpoint = browser.wsEndpoint();
    const browserURL = wsEndpoint.replace('ws://', 'http://').replace('/devtools/browser', '');

    const lhResultPath = path.join(resultadosPath, 'lh-report.json');
    const result = await lighthouse(url, {
      port: new URL(browserURL).port,
      output: 'json',
      onlyCategories: ['seo']
    });

    fs.writeFileSync(lhResultPath, result.report);
    const seoScore = result.lhr.categories.seo.score * 100;

    // 3. SEO Analyzer
    console.log('🔍 Ejecutando seo-analyzer...');
    const analysis = await analyzer({ url });

    // 4. Crear PDF
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
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err.message || err);
    process.exit(1);
  }
});
