const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Función principal
(async () => {
  const url = process.argv[2];
  if (!url || !url.startsWith('http')) {
    console.error('❌ Debes proporcionar una URL válida como argumento.');
    process.exit(1);
  }

  console.log(`🔍 Navegando a: ${url}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const textoVisible = await page.evaluate(() => {
      function obtenerTextoVisible(nodo) {
        if (nodo.nodeType === Node.TEXT_NODE) {
          return nodo.textContent.trim();
        }
        if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName !== 'SCRIPT' && nodo.tagName !== 'STYLE' && getComputedStyle(nodo).display !== 'none') {
          return Array.from(nodo.childNodes).map(obtenerTextoVisible).join(' ');
        }
        return '';
      }
      return obtenerTextoVisible(document.body);
    });

    const fecha = new Date().toISOString().split('T')[0];
    const dominio = new URL(url).hostname.replace(/^www\./, '');
    const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);

    fs.mkdirSync(carpeta, { recursive: true });

    const archivo = path.join(carpeta, 'scraping.txt');
    fs.writeFileSync(archivo, textoVisible.trim());

    console.log(`✅ Scraping guardado en: ${archivo}`);
  } catch (err) {
    console.error('⚠️ Error durante el scraping:', err.message);
  } finally {
    await browser.close();
  }
})();
