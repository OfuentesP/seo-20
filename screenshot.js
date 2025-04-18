const puppeteer = require('puppeteer');

module.exports = async function(url, outputPath = 'screenshot.png') {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: outputPath, fullPage: true });
  await browser.close();
};
