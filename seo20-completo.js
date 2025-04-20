const readline = require('readline');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');
const { generarPDF } = require('./generar-pdf');
const path = require('path');
const fs = require('fs');
const ejecutarScraping = require('./generar-scraping-funcional');

async function leerURLDesdeStdin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('🔗 Ingresa la URL a analizar: ', respuesta => {
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

(async () => {
  const url = await leerURLDesdeStdin();

  // 🔹 Validación básica
  if (!url || !url.startsWith('http')) {
    console.error('❌ URL inválida');
    process.exit(1);
  }

  console.log('📥 Iniciando scraping...');
  await ejecutarScraping(url);
  console.log('✅ Scraping completado. Analizando con Lighthouse...');

  // 🔹 Extraer datos del scraping para incluirlos en homeResult
  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  const scrapingPath = path.join(carpeta, 'scraping.txt');
  let textoScraping = '';

  if (fs.existsSync(scrapingPath)) {
    textoScraping = fs.readFileSync(scrapingPath, 'utf-8').trim();
  }

  // 🔹 Construcción de informe (se pasa el textoScraping como parte del homeResult)
  const informeMarkdown = await generarInformeUnificadoCompleto({
    url,
    textoScraping // <- nuevo campo
  });

  const informePath = path.join(carpeta, 'informe-seo.pdf');
  await generarPDF(informeMarkdown, informePath);

  console.log(`🎉 Informe generado: ${informePath}`);
})();
