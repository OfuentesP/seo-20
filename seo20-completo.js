const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');
const generarPDFConHTML = require('./pdf-generator');
const path = require('path');
const fs = require('fs');
const ejecutarScraping = require('./generar-scrapping-funcional');

async function ejecutarLighthouse(url, carpeta) {
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'info'
  });

  await chrome.kill();

  const outputPath = path.join(carpeta, 'lighthouse.json');
  fs.writeFileSync(outputPath, result.report);
  console.log(`📊 Lighthouse guardado en: ${outputPath}`);
}

(async () => {
  const url = process.argv[2];

  if (!url || !url.startsWith('http')) {
    console.error('❌ Debes proporcionar una URL válida como argumento.');
    process.exit(1);
  }

  console.log('📥 Iniciando scraping...');
  await ejecutarScraping(url);
  console.log('✅ Scraping completado.');

  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  const scrapingPath = path.join(carpeta, 'scraping.txt');
  let textoScraping = '';

  if (fs.existsSync(scrapingPath)) {
    textoScraping = fs.readFileSync(scrapingPath, 'utf-8').trim();
  }

  // 🔹 Ejecutar Lighthouse
  await ejecutarLighthouse(url, carpeta);

  // 🔹 Leer resultados de Lighthouse
  let lighthouseScoresHTML = '';
  try {
    const lighthousePath = path.join(carpeta, 'lighthouse.json');
    const lighthouseResult = JSON.parse(fs.readFileSync(lighthousePath, 'utf-8'));
    const categories = lighthouseResult.categories;

    lighthouseScoresHTML = `
      <h2>Resultados de Lighthouse</h2>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Puntuación</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Rendimiento</td><td>${Math.round(categories.performance.score * 100)} / 100</td></tr>
          <tr><td>Accesibilidad</td><td>${Math.round(categories.accessibility.score * 100)} / 100</td></tr>
          <tr><td>Buenas Prácticas</td><td>${Math.round(categories['best-practices'].score * 100)} / 100</td></tr>
          <tr><td>SEO</td><td>${Math.round(categories.seo.score * 100)} / 100</td></tr>
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('❌ Error al leer lighthouse.json. Usando valores predeterminados.');
    lighthouseScoresHTML = `
      <h2>Resultados de Lighthouse</h2>
      <p>No se pudieron obtener los resultados de Lighthouse. Se muestran valores predeterminados.</p>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Puntuación</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Rendimiento</td><td>N/A</td></tr>
          <tr><td>Accesibilidad</td><td>N/A</td></tr>
          <tr><td>Buenas Prácticas</td><td>N/A</td></tr>
          <tr><td>SEO</td><td>N/A</td></tr>
        </tbody>
      </table>
    `;
  }

  // 🔹 Leer Core Web Vitals de Lighthouse
  let coreWebVitalsHTML = '';
  try {
    const lighthousePath = path.join(carpeta, 'lighthouse.json');
    const lighthouseResult = JSON.parse(fs.readFileSync(lighthousePath, 'utf-8'));
    const audits = lighthouseResult.audits;

    const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
    const fid = audits['first-input-delay']?.displayValue || 'N/A';
    const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';

    coreWebVitalsHTML = `
      <h2>Como está funcionando mi página</h2>
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Valor</th>
            <th>Requerido</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>LCP (Largest Contentful Paint)</td><td>${lcp}</td><td>Menos de 2.5s</td></tr>
          <tr><td>FID (First Input Delay)</td><td>${fid}</td><td>Menos de 100ms</td></tr>
          <tr><td>CLS (Cumulative Layout Shift)</td><td>${cls}</td><td>Menos de 0.1</td></tr>
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('❌ Error al leer lighthouse.json para Core Web Vitals. Usando valores predeterminados.');
    lighthouseScoresHTML = `
      <h2>Resultados de Lighthouse</h2>
      <p>No se pudieron obtener los resultados de Lighthouse. Se muestran valores predeterminados.</p>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Puntuación</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Rendimiento</td><td>N/A</td></tr>
          <tr><td>Accesibilidad</td><td>N/A</td></tr>
          <tr><td>Buenas Prácticas</td><td>N/A</td></tr>
          <tr><td>SEO</td><td>N/A</td></tr>
        </tbody>
      </table>
    `;
  }

  // 🔹 Generar secciones del informe
  const { homeResult } = await generarInformeUnificadoCompleto({
    url,
    textoScraping
  });

  const homeResultHTML = homeResult
    .map(b => `<h3>${b.titulo}</h3>\n${b.contenido}`)
    .join('\n');

  // 🔹 Cargar otras secciones si existen
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
    lighthouseScoresHTML,
    coreWebVitalsHTML,
    homeResultHTML,
    recomendacionesHTML,
    sitemapHTML,
    urlsPorPaginaHTML,
    erroresHTML,
    outputPath: informePath
  });

  console.log(`🎉 Informe PDF final generado: ${informePath}`);
})();
