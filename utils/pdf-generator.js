const fs = require('fs');
const puppeteer = require('puppeteer');
const markdownIt = require('markdown-it')();

module.exports = async function generatePdfFromMd(mdPath, pdfPath) {
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const htmlContent = markdownIt.render(mdContent);
  const html = `<html><head><meta charset="utf-8"><style>
    body { font-family: sans-serif; padding: 40px; }
    h1, h2, h3 { color: #003366; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    th, td { border: 1px solid #ccc; padding: 8px; }
  </style></head><body>${htmlContent}</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();
};
