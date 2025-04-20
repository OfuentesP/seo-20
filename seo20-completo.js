const readline = require('readline');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');
const generarPDFConHTML = require('./pdf-generator'); // Nuevo import
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

  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  const scrapingPath = path.join(carpeta, 'scraping.txt');
  let textoScraping = '';

  if (fs.existsSync(scrapingPath)) {
    textoScraping = fs.readFileSync(scrapingPath, 'utf-8').trim();
  }

  // 🔹 Obtenemos el informe con los datos estructurados
  const homeResult = await generarInformeUnificadoCompleto({
    url,
    textoScraping
  });

  // 🔹 Convertimos los bloques a HTML
  const homeResultHTML = homeResult.map(b => `<h3>${b.titulo}</h3><p>${b.contenido}</p>`).join('');

  const recomendacionesPath = path.join(carpeta, 'recomendaciones.html');
  const sitemapPath = path.join(carpeta, 'sitemap-analysis.html');
  const urlsPath = path.join(carpeta, 'analisis-por-url.html');
  const erroresPath = path.join(carpeta, 'urls-con-errores.html');

  const recomendacionesHTML = fs.existsSync(recomendacionesPath) ? fs.readFileSync(recomendacionesPath, 'utf-8') : '';
  const sitemapHTML = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf-8') : '';
  const urlsPorPaginaHTML = fs.existsSync(urlsPath) ? fs.readFileSync(urlsPath, 'utf-8') : '';
  const erroresHTML = fs.existsSync(erroresPath) ? fs.readFileSync(erroresPath, 'utf-8') : '';

  const informePath = path.join(carpeta, 'informe-seo-final.pdf');
  await generarPDFConHTML({
    sitio: dominio,
    fecha,
    homeResultHTML,
    recomendacionesHTML,
    sitemapHTML,
    urlsPorPaginaHTML,
    erroresHTML,
    outputPath: informePath
  });

  console.log(`🎉 Informe PDF final generado: ${informePath}`);
})();
