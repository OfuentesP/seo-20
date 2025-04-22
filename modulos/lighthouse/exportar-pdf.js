const puppeteer = require('puppeteer');

async function generarPDFdesdeHTML(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: puppeteer.executablePath(),
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  console.log(`✅ PDF generado: ${outputPath}`);
}

module.exports = generarPDFdesdeHTML;
