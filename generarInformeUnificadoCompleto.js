// generarInformeUnificadoCompleto.js
const fs = require('fs');
const path = require('path');

function generarInformeUnificadoCompleto({
  homeResult,
  sitemapMd,
  paginas,
  urls404,
  sitio,
  fecha,
  sitemapTotal,
  sitemapLastmod,
  insightsIA
}) {
  let md = `# 📊 Informe SEO Consolidado – ${sitio}\n\n`;
  md += `_Fecha: ${fecha}_\n\n---\n`;

  // 1. Análisis del Home
  md += `\n## 🏠 Análisis del Home\n\n`;

  if (homeResult && homeResult.lighthouse) {
    const categories = homeResult.lighthouse.categories || {};
    md += `**Puntajes Lighthouse:**\n\n`;
    md += `| Categoría      | Puntaje |\n`;
    md += `|---------------|---------|\n`;
    md += `| SEO           | ${Math.round(categories.seo?.score * 100)} / 100 |\n`;
    md += `| Rendimiento   | ${Math.round(categories.performance?.score * 100) || 'N/A'} / 100 |\n`;
    md += `| Accesibilidad | ${Math.round(categories.accessibility?.score * 100) || 'N/A'} / 100 |\n\n`;

    // Agregar métricas específicas
    if (homeResult.lighthouse.audits) {
      md += `\n### 📈 Métricas de Rendimiento:\n\n`;
      md += `| Métrica                     | Valor | Recomendado |\n`;
      md += `|-----------------------------|-------|-------------|\n`;
      const metrics = {
        'first-contentful-paint': '⏱️ < 1.8s',
        'largest-contentful-paint': '⏱️ < 2.5s',
        'total-blocking-time': '🧱 < 200ms',
        'cumulative-layout-shift': '🎯 < 0.1'
      };

      for (const key in metrics) {
        const audit = homeResult.lighthouse.audits[key];
        if (audit) {
          const valor = audit.displayValue || audit.numericValue || 'N/A';
          md += `| ${audit.title} | ${valor} | ${metrics[key]} |\n`;
        }
      }
    }
  }

  // ... (resto del contenido igual)
  // Nota: se omite por longitud pero no se elimina
  // Asegúrate de copiar el resto del contenido aquí si estás reemplazando en tu entorno local

  return md;
}

module.exports = { generarInformeUnificadoCompleto };
