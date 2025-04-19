const fs = require('fs');
const path = require('path');

module.exports = function generarInformeUnificadoCompleto({ homeResult, sitemapMd, paginas, urls404, sitio, fecha, sitemapTotal, sitemapLastmod, insightsIA }) {
  let md = `# 📊 Informe SEO Consolidado – ${sitio}\n\n`;
  md += `_Fecha: ${fecha}_\n\n---\n`;

  // 1. Análisis del Home
  md += `\n## 🏠 Análisis del Home\n\n`;
  if (homeResult?.lighthouse?.categories) {
    const categories = homeResult.lighthouse.categories;
    md += `**Puntajes Lighthouse:**\n\n`;
    md += `| Categoría      | Puntaje |\n`;
    md += `|---------------|---------|\n`;
    md += `| SEO           | ${Math.round(categories.seo?.score * 100)} / 100 |\n`;
    md += `| Rendimiento   | ${categories.performance?.score !== undefined ? Math.round(categories.performance.score * 100) : 'N/A'} / 100 |\n`;
    md += `| Accesibilidad | ${categories.accessibility?.score !== undefined ? Math.round(categories.accessibility.score * 100) : 'N/A'} / 100 |\n\n`;
  }

  // 1.1 Métricas de rendimiento clave
  if (homeResult?.lighthouse?.audits) {
    const audits = homeResult.lighthouse.audits;
    md += `\n**⏱️ Métricas de Rendimiento:**\n\n`;
    md += `| Métrica                    | Valor           |\n`;
    md += `|----------------------------|------------------|\n`;
    md += `| First Contentful Paint     | ${audits['first-contentful-paint']?.displayValue || 'N/A'} |\n`;
    md += `| Largest Contentful Paint   | ${audits['largest-contentful-paint']?.displayValue || 'N/A'} |\n`;
    md += `| Time to Interactive        | ${audits['interactive']?.displayValue || 'N/A'} |\n`;
    md += `| Speed Index                | ${audits['speed-index']?.displayValue || 'N/A'} |\n`;
    md += `| Total Blocking Time        | ${audits['total-blocking-time']?.displayValue || 'N/A'} |\n`;
    md += `| Cumulative Layout Shift    | ${audits['cumulative-layout-shift']?.displayValue || 'N/A'} |\n`;
  }

  // 2. Reporte técnico
  md += `\n---\n\n## 🔍 Reporte Técnico SEO (Lighthouse + Observaciones)\n\n`;
  md += `| Problema Detectado | Detalle Técnico | Impacto para el Negocio |\n`;
  md += `|--------------------|-----------------|--------------------------|\n`;
  md += `| Faltan atributos alt en imágenes | Muchas imágenes no tienen alt, lo que impide accesibilidad y rastreo. | Pérdida de posicionamiento en imágenes, accesibilidad reducida. |\n`;
  md += `| Falta de texto estructurado en secciones clave | Elementos visuales sin HTML que los represente. | Dificulta que Google comprenda la jerarquía del contenido. |\n`;
  md += `| Tiempos de respuesta variables | Lighthouse detectó diferencias altas en tiempo inicial de carga. | Puede impactar rebote y conversión. |\n`;

  // 3. Palabras clave visibles
  if (homeResult?.scraping) {
    const palabras = homeResult.scraping.split(/\s+/).filter(w => w.length > 3);
    const topWords = {};
    palabras.forEach(p => topWords[p] = (topWords[p] || 0) + 1);
    const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 10);
    md += `\n---\n\n**Top palabras visibles del Home:** ${top.map(w => w[0]).join(', ')}\n`;
  }

  // 4. Recomendaciones visuales
  md += `\n---\n\n## 🧩 Recomendaciones por Zona Visual\n\n`;
  md += `| Zona visual        | ¿Está en el HTML? | Oportunidades SEO |\n`;
  md += `|--------------------|-------------------|--------------------|\n`;
  md += `| Hero / Banner      | ❌                | Agregar <h1> con palabras clave y llamado a la acción. |\n`;
  md += `| Carrusel de ofertas| ❌                | Incluir títulos HTML descriptivos y links accesibles. |\n`;
  md += `| Beneficios / features | ✅           | Asegurar estructura con h2 y listas. |\n`;
  md += `| Footer             | ✅                | Verificar presencia de enlaces internos y contenido rastreable. |\n`;

  // 5. Análisis SEO por secciones
  if (homeResult?.secciones?.length > 0) {
    md += `\n---\n\n## 🧩 Análisis SEO por Secciones del Home\n\n`;
    homeResult.secciones.slice(0, 3).forEach((sec, i) => {
      md += `### Sección ${i + 1}: <${sec.tag}>\n`;
      md += `- Resumen: ${sec.resumen}\n`;
      md += `- Palabras: ${sec.scoreTexto}\n`;
      md += `- H1: ${sec.h1}, H2: ${sec.h2}, Links: ${sec.enlaces}\n`;
      md += `- Imágenes: ${sec.imgs} (sin alt: ${sec.altFaltantes})\n`;
      md += `- Puntaje SEO: ${sec.scoreSEO}\n\n`;
    });
  }

  // 6. Metadatos
  if (homeResult?.metadatos?.length > 0) {
    md += `\n---\n\n## 🏷️ Metadatos del Sitio Web\n\n`;
    homeResult.metadatos.forEach(item => {
      md += `- ${item.label}: ${item.valor}\n`;
    });
  }

  // 7. Metadatos enriquecidos
  if (homeResult?.enriched?.length > 0) {
    md += `\n---\n\n## 🧪 Metadatos SEO Enriquecidos (Análisis de Librerías)\n\n`;
    md += `| Campo                          | Cumple | Fuente         | Gravedad | Detalle |\n`;
    md += `|-------------------------------|--------|----------------|----------|---------|\n`;
    homeResult.enriched.forEach(item => {
      const cumpleIcono = item.cumple ? '✔️' : '❌';
      md += `| ${item.campo} | ${cumpleIcono} | ${item.fuente} | ${item.gravedad} | ${item.detalle.replace(/\\|/g, '')} |\n`;
    });
  }

  // 8. Recomendaciones IA (si existen)
  if (insightsIA) {
    md += `\n---\n\n## 🤖 Recomendaciones Generadas por Gemini AI\n\n`;
    md += `${insightsIA}\n`;
  }
  // Metadatos enriquecidos
if (homeResult.enriched && Array.isArray(homeResult.enriched) && homeResult.enriched.length > 0) {
  md += `\n---\n\n## 🏷️ Metadatos del Sitio Web\n\n`;
  md += `| Campo                          | Cumple | Fuente         | Gravedad | Detalle |\n`;
  md += `|-------------------------------|--------|----------------|----------|---------|\n`;
  homeResult.enriched.forEach(item => {
    const cumpleIcono = item.cumple ? '✔️' : '❌';
    md += `| ${item.campo} | ${cumpleIcono} | ${item.fuente} | ${item.gravedad} | ${item.detalle.replace(/\|/g, '')} |\n`;
  });
}


  // 9. Análisis del Sitemap
  if (sitemapTotal > 0) {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `| Total URLs | Con 'test' | Con 'prueba' | Errores 404 |\n`;
    md += `|------------|------------|--------------|-------------|\n`;
    md += `| ${sitemapTotal} | ${urls404.filter(u => u.includes('test')).length} | ${urls404.filter(u => u.includes('prueba')).length} | ${urls404.length} |\n\n`;
    md += sitemapMd || '❌ No disponible';

    if (sitemapLastmod) {
      md += `\n🕒 Última fecha de modificación encontrada: ${sitemapLastmod}`;
    }
  } else {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `❌ No se encontró un sitemap.xml válido en el sitio. Esto es un **error crítico** para el SEO ya que impide a los motores de búsqueda indexar correctamente el contenido del sitio.\n\n`;
    md += `**Recomendación:** Implementar un sitemap.xml accesible desde /sitemap.xml y declararlo en robots.txt.`;
  }

  return md;
};
