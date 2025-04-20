const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2];
  if (!url || !url.startsWith('http')) {
    console.error('❌ Debes pasar una URL válida como argumento.');
    process.exit(1);
  }

  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'info'
  });

  await chrome.kill();

  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const folder = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  mkdirSync(folder, { recursive: true });

  const jsonPath = path.join(folder, 'lighthouse.json');
  writeFileSync(jsonPath, result.report);
  console.log(`✅ Lighthouse guardado en: ${jsonPath}`);
})();
