const puppeteer = require('puppeteer');

async function ejecutarLighthouse(url, carpeta) {
  const { default: lighthouse } = await import('lighthouse');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--remote-debugging-port=9222'],
    executablePath: puppeteer.executablePath()
  });

  const endpoint = new URL(browser.wsEndpoint());
  const port = endpoint.port;

  try {
    const result = await lighthouse(url, {
      port,
      output: 'json',
      logLevel: 'info',
      onlyCategories: ['seo', 'performance'] // ⚡ análisis más rápido y liviano
    });

    const outputPath = path.join(carpeta, 'lighthouse.json');
    fs.writeFileSync(outputPath, result.report);
    console.log(`📊 Lighthouse guardado en: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error ejecutando Lighthouse:', error);
  } finally {
    await browser.close();
  }
}
