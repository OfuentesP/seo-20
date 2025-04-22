const fs = require('fs');
const path = require('path');
const generarPDFdesdeHTML = require('./exportar-pdf');

async function generarReporteLighthouse(rutaJson = './resultados/lighthouse.json') {
  const outputPdf = './resultados/lighthouse.pdf';

  if (!fs.existsSync(rutaJson)) {
    throw new Error(`No se encontró el archivo: ${rutaJson}`);
  }

  const datos = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));
  const categorias = datos.categories;
  const audits = datos.audits;
  const urlSitio = datos.finalUrl || 'Sitio web';

  const coreWebVitals = {
    'First Contentful Paint': {
      valor: audits['first-contentful-paint']?.displayValue || '—',
      recomendado: '< 1.8s',
    },
    'Largest Contentful Paint': {
      valor: audits['largest-contentful-paint']?.displayValue || '—',
      recomendado: '< 2.5s',
    },
    'Total Blocking Time': {
      valor: audits['total-blocking-time']?.displayValue || '—',
      recomendado: '< 200ms',
    },
    'Cumulative Layout Shift': {
      valor: audits['cumulative-layout-shift']?.displayValue || '—',
      recomendado: '< 0.1',
    },
  };

  const lighthouseHtml = `
    <html>
      <head>
        <title>Reporte Lighthouse</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1, h2 { color: #2c3e50; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>🏠 Reporte Lighthouse – ${urlSitio}</h1>

        <h2>📊 Puntajes Lighthouse:</h2>
        <table>
          <thead>
            <tr><th>Categoría</th><th>Puntaje</th></tr>
          </thead>
          <tbody>
            ${Object.entries(categorias).map(([clave, val]) =>
              `<tr><td>${val.title}</td><td>${Math.round(val.score * 100)} / 100</td></tr>`
            ).join('')}
          </tbody>
        </table>

        <h2>📈 Métricas de Rendimiento:</h2>
        <table>
          <thead>
            <tr><th>Métrica</th><th>Valor</th><th>Recomendado</th></tr>
          </thead>
          <tbody>
            ${Object.entries(coreWebVitals).map(([metrica, valores]) =>
              `<tr><td>${metrica}</td><td>${valores.valor}</td><td>${valores.recomendado}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  await generarPDFdesdeHTML(lighthouseHtml, outputPdf);
  
  const htmlOutputPath = './resultados/lighthouse.html';
fs.writeFileSync(htmlOutputPath, lighthouseHtml, 'utf-8');
console.log(`📝 HTML guardado en: ${htmlOutputPath}`);


return {
  html: lighthouseHtml,
  pdf: outputPdf,
  htmlPath: htmlOutputPath,
};

}

module.exports = generarReporteLighthouse;
