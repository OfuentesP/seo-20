const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const generarResumenTecnicoSEO = require('./resumen-tecnico-seo');

async function analizarConLighthouse(url) {
  const API_KEY = process.env.PAGESPEED_API_KEY;
  if (!API_KEY) throw new Error('❌ No se encontró la API Key. Asegúrate de tener PAGESPEED_API_KEY en el .env');

  // Usamos estrategia mobile
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&strategy=mobile`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`❌ Error al consultar PageSpeed API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.lighthouseResult;

  console.log('📦 Categorías entregadas por la API:', Object.keys(result.categories));

  // Guardar el JSON en un archivo temporal para análisis
  const tmpPath = path.join(__dirname, '../../tmp-lighthouse.json');
  fs.writeFileSync(tmpPath, JSON.stringify(result, null, 2));

  // Generar resumen técnico SEO en formato Markdown
  const resumenTecnicoSEO = generarResumenTecnicoSEO(tmpPath);

  return {
    url: result.finalUrl,
    scores: {
      performance: result.categories?.performance?.score ?? null,
      accessibility: result.categories?.accessibility?.score ?? null,
      bestPractices: result.categories?.['best-practices']?.score ?? null,
      seo: result.categories?.seo?.score ?? null,
      pwa: result.categories?.pwa?.score ?? null,
    },
    webVitals: {
      lcp: result.audits?.['largest-contentful-paint']?.displayValue ?? null,
      cls: result.audits?.['cumulative-layout-shift']?.displayValue ?? null,
      fid: result.audits?.['total-blocking-time']?.displayValue ?? null,
    },
    auditoriasSEO: result.audits || {},
    raw: result,
    resumenTecnicoSEO // ✅ Ya está listo para el PDF
  };
}

module.exports = { analizarConLighthouse };
