const { analizarConLighthouse } = require('./modulos/pagespeed');
const generarReporteSitemap = require('./modulos/sitemap/index');
const { generarInformeUnificadoCompleto } = require('./generarInformeUnificadoCompleto');
const generarPDFDesdePlantilla = require('./generarPDFDesdePlantilla');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

async function main() {
  const input = await leerURLDesdeStdin();
  const url = input.trim();

  if (!url.startsWith('http')) {
    console.error('❌ URL inválida. Asegúrate de incluir http o https.');
    process.exit(1);
  }

  const dominio = extraerDominio(url);
  const fecha = dayjs().format('YYYY-MM-DD');
  const carpetaDestino = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);
  fs.mkdirSync(carpetaDestino, { recursive: true });

  console.log('🚀 Iniciando análisis con PageSpeed Insights API...');
  let resultadoLighthouse;

  try {
    resultadoLighthouse = await analizarConLighthouse(url);
    const rutaJson = path.join(carpetaDestino, 'lighthouse.json');
    fs.writeFileSync(rutaJson, JSON.stringify(resultadoLighthouse.raw, null, 2));
    console.log(`✅ Resultado guardado en: ${rutaJson}`);
  } catch (error) {
    console.error('❌ Error en Lighthouse:', error.message);
    process.exit(1);
  }

  try {
    console.log('📥 Analizando sitemap...');
    await generarReporteSitemap(url, carpetaDestino);

    console.log('📄 Generando contenido markdown...');
    const scrapingPath = path.join(carpetaDestino, 'scraping.txt');
    const textoScraping = fs.existsSync(scrapingPath)
      ? fs.readFileSync(scrapingPath, 'utf-8')
      : 'No se encontró contenido del home.';

    const informeMarkdown = await generarInformeUnificadoCompleto({
      url,
      textoScraping,
      lighthouse: resultadoLighthouse.raw
    });

    const sitemapMdPath = path.join(carpetaDestino, 'sitemap-analysis.md');
    const sitemapMd = fs.existsSync(sitemapMdPath)
      ? fs.readFileSync(sitemapMdPath, 'utf-8')
      : '❌ No se pudo generar sitemap-analysis.md';

    const urlsMdPath = path.join(carpetaDestino, 'analisis-por-url.md');
    const urlsPorPagina = fs.existsSync(urlsMdPath)
      ? fs.readFileSync(urlsMdPath, 'utf-8')
      : '❌ No se encontró análisis por URL.';

    const erroresMdPath = path.join(carpetaDestino, 'urls-con-errores.md');
    const errores404 = fs.existsSync(erroresMdPath)
      ? fs.readFileSync(erroresMdPath, 'utf-8')
      : '❌ No se encontraron errores 404 registrados.';

    const resumenMd = resultadoLighthouse.resumenTecnicoSEO || '';

    const webVitals = resultadoLighthouse.webVitals || {};
    const coreWebVitals = `
| Métrica | Valor |
|---------|--------|
| LCP     | ${webVitals.lcp || 'No disponible'} |
| CLS     | ${webVitals.cls || 'No disponible'} |
| TBT     | ${webVitals.fid || 'No disponible'} |
`;

    const informeDebug = path.join(carpetaDestino, 'informe-debug.md');
    fs.writeFileSync(informeDebug, informeMarkdown + '\n\n' + sitemapMd + '\n\n' + resumenMd);

    const rutaPDF = path.join(carpetaDestino, 'informe-seo-estilizado.pdf');

    await generarPDFDesdePlantilla({
      sitio: dominio,
      fecha,
      lighthouseScores: informeMarkdown,
      coreWebVitals,
      homeResult: textoScraping,
      recomendaciones: resumenMd,
      sitemap: sitemapMd,
      urlsPorPagina,
      errores404,
      outputPdfPath: rutaPDF
    });

    console.log(`✅ PDF final guardado en: ${rutaPDF}`);

  } catch (error) {
    console.error('❌ Error al generar el informe:', error.message);
  }
}

function extraerDominio(url) {
  return url.replace(/^https?:\/\//, '').split('/')[0];
}

function leerURLDesdeStdin() {
  return new Promise((resolve) => {
    const stdin = process.openStdin();
    let data = '';
    stdin.on('data', (chunk) => { data += chunk; });
    stdin.on('end', () => resolve(data));
    if (process.stdin.isTTY) {
      process.stdout.write('🔗 Ingresa la URL: ');
      process.stdin.once('data', () => process.stdin.end());
    }
  });
}

main();
