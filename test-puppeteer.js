const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: 'example.png' });
  await browser.close();
  console.log('✅ Screenshot tomada correctamente.');
})();
