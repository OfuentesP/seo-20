const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://www.surdiseno.cl';

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

  // Espera a que cargue lo visible
  await new Promise(resolve => setTimeout(resolve, 3000));


  // Captura screenshot completo (scroll incluido)
  await page.screenshot({ path: 'screenshot-surdiseno.png', fullPage: true });

  console.log('✅ Screenshot guardado como screenshot-surdiseno.png');

  await browser.close();
})();
