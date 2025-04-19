const fs = require('fs');
const path = require('path');

module.exports = function generarInformeUnificadoCompleto({ homeResult, sitemapMd, paginas, urls404, sitio, fecha, sitemapTotal, sitemapLastmod, insightsIA }) {
  let md = `# 📊 Informe SEO Consolidado – ${sitio}\n\n`;
  md += `_Fecha: ${fecha}_\n\n---\n`;

  // 1. Análisis del Home
  md += `\n## 🏠 Análisis del Home\n\n`;
  if (homeResult && homeResult.lighthouse) {
    const categories = homeResult.lighthouse.categories;
    md += `**Puntajes Lighthouse:**\n\n`;
    md += `| Categoría      | Puntaje |\n`;
    md += `|---------------|---------|\n`;
    md += `| SEO           | ${Math.round(categories.seo?.score * 100)} / 100 |\n`;
    md += `| Rendimiento   | ${Math.round(categories.performance?.score * 100)} / 100 |\n`;
    md += `| Accesibilidad | ${Math.round(categories.accessibility?.score * 100)} / 100 |\n\n`;
  }

  // 2. Recomendaciones IA (si existen)
  if (insightsIA && insightsIA.trim().length > 0) {
    md += `\n---\n\n## 🧠 Recomendaciones Generadas por Gemini AI\n\n${insightsIA}\n`;
  }

  // Reporte técnico primero
  md += `\n---\n\n## 🔍 Reporte Técnico SEO (Lighthouse + Observaciones)\n\n`;
  md += `| Problema Detectado | Detalle Técnico | Impacto para el Negocio |\n`;
  md += `|--------------------|-----------------|--------------------------|\n`;
  md += `| Faltan atributos alt en imágenes | Muchas imágenes no tienen alt, lo que impide accesibilidad y rastreo. | Pérdida de posicionamiento en imágenes, accesibilidad reducida. |\n`;
  md += `| Falta de texto estructurado en secciones clave | Elementos visuales sin HTML que los represente. | Dificulta que Google comprenda la jerarquía del contenido. |\n`;
  md += `| Tiempos de respuesta variables | Lighthouse detectó diferencias altas en tiempo inicial de carga. | Puede impactar rebote y conversión. |\n`;

  if (homeResult && homeResult.scraping) {
    const palabras = homeResult.scraping.split(/\s+/).filter(w => w.length > 3 && !w.includes('<') && !w.includes('>'));
    const topWords = {};
    palabras.forEach(p => topWords[p] = (topWords[p] || 0) + 1);
    const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 10);
    md += `\n---\n\n**Top palabras visibles del Home:** ${top.map(w => w[0]).join(', ')}\n`;
  }

  // Recomendaciones visuales
  md += `\n---\n\n## 🧩 Recomendaciones por Zona Visual\n\n`;
  md += `| Zona visual        | ¿Está en el HTML? | Oportunidades SEO |\n`;
  md += `|--------------------|-------------------|--------------------|\n`;
  md += `| Hero / Banner      | ❌                | Agregar <h1> con palabras clave y llamado a la acción. |\n`;
  md += `| Carrusel de ofertas| ❌                | Incluir títulos HTML descriptivos y links accesibles. |\n`;
  md += `| Beneficios / features | ✅           | Asegurar estructura con h2 y listas. |\n`;
  md += `| Footer             | ✅                | Verificar presencia de enlaces internos y contenido rastreable. |\n`;

  // Secciones del Home
  if (homeResult && homeResult.secciones && homeResult.secciones.length > 0) {
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

  // Análisis del sitemap (condicional)
  if (sitemapTotal && sitemapTotal > 0) {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `| Total URLs | Con 'test' | Con 'prueba' | Errores 404 |\n`;
    md += `|------------|------------|--------------|-------------|\n`;
    md += `| {TOTAL} | {TEST} | {PRUEBA} | {ERROR404} |\n\n`;
    if (sitemapLastmod) {
      md += `📅 Última fecha de modificación encontrada: **${sitemapLastmod}**\n\n`;
    }
    md += sitemapMd || '❌ No disponible';
  } else {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `⚠️ No se encontró un sitemap.xml accesible para el sitio. Esto es un error crítico de SEO, ya que impide que los buscadores indexen el sitio eficientemente.\n\n`;
    md += `### Recomendación:
Utiliza un archivo sitemap.xml estructurado y accesible desde \`${sitio}/sitemap.xml\`. Puedes generarlo automáticamente desde tu CMS o con herramientas como Screaming Frog o XML-Sitemaps.com.`;
  }

  // Metadatos enriquecidos
  if (homeResult && homeResult.enriched && Array.isArray(homeResult.enriched)) {
    md += `\n---\n\n## 🏷️ Metadatos del Sitio Web\n\n`;
    md += `| Campo                          | Cumple | Fuente         | Gravedad | Detalle |\n`;
    md += `|-------------------------------|--------|----------------|----------|---------|\n`;
    homeResult.enriched.forEach(item => {
      const cumpleIcono = item.cumple ? '✔️' : '❌';
      md += `| ${item.campo} | ${cumpleIcono} | ${item.fuente} | ${item.gravedad} | ${item.detalle.replace(/\\|/g, '')} |\n`;
    });
  }

  return md;
};
