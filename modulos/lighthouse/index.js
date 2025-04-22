const fs = require('fs');
const path = require('path');

function generarBloqueLighthouse(rutaLighthouseJson) {
  const data = JSON.parse(fs.readFileSync(rutaLighthouseJson, 'utf-8'));
  const categories = data.categories || {};
  const audits = data.audits || {};

  const coreVitals = ['largest-contentful-paint', 'first-contentful-paint', 'cumulative-layout-shift', 'interactive', 'total-blocking-time'];

  const resultados = [];

  resultados.push(`<h2>Análisis Lighthouse</h2>`);

  // Scores por categoría
  resultados.push(`<h3>Resumen por Categoría</h3>`);
  resultados.push('<ul>');
  for (const key in categories) {
    const cat = categories[key];
    resultados.push(`<li><strong>${cat.title}:</strong> ${(cat.score * 100).toFixed(0)} / 100</li>`);
  }
  resultados.push('</ul>');

  // Core Web Vitals
  resultados.push(`<h3>Core Web Vitals</h3>`);
  resultados.push('<ul>');
  coreVitals.forEach(id => {
    const audit = audits[id];
    if (audit) {
      resultados.push(`<li><strong>${audit.title}:</strong> ${audit.displayValue || audit.numericValue}</li>`);
    }
  });
  resultados.push('</ul>');

  // Auditorías con problemas
  resultados.push(`<h3>Auditorías SEO con Problemas</h3>`);
  const fallidas = Object.values(audits).filter(a => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary');
  resultados.push('<ul>');
  fallidas.forEach(a => {
    resultados.push(`<li><strong>${a.title}:</strong> ${a.description}</li>`);
  });
  resultados.push('</ul>');

  return resultados.join('\n');
}

module.exports = { generarBloqueLighthouse };
