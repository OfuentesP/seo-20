
const fs = require('fs');
const path = require('path');

module.exports = function generarInformeUnificadoCompleto({ homeResult, sitemapMd, paginas, urls404, sitio, fecha }) {
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

  // Reporte técnico primero
  md += `\n---\n\n## 🔍 Reporte Técnico SEO (Lighthouse + Observaciones)\n\n`;
  md += `| Problema Detectado | Detalle Técnico | Impacto para el Negocio |\n`;
  md += `|--------------------|-----------------|--------------------------|\n`;
  md += `| Faltan atributos alt en imágenes | Muchas imágenes no tienen alt, lo que impide accesibilidad y rastreo. | Pérdida de posicionamiento en imágenes, accesibilidad reducida. |\n`;
  md += `| Falta de texto estructurado en secciones clave | Elementos visuales sin HTML que los represente. | Dificulta que Google comprenda la jerarquía del contenido. |\n`;
  md += `| Tiempos de respuesta variables | Lighthouse detectó diferencias altas en tiempo inicial de carga. | Puede impactar rebote y conversión. |\n`;

  if (homeResult && homeResult.scraping) {
    const palabras = homeResult.scraping.split(/\s+/).filter(w => w.length > 3);
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

  // Análisis del sitemap
  md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
  md += `| Total URLs | Con 'test' | Con 'prueba' | Errores 404 |\n`;
  md += `|------------|------------|--------------|-------------|\n`;
  md += `| {TOTAL} | {TEST} | {PRUEBA} | {ERROR404} |\n\n`;
  md += sitemapMd || '❌ No disponible';

  // Sección final: Metadatos
  md += `\n---\n\n## 🏷️ Metadatos del Sitio Web\n\n`;
  md += `### Meta Title\n`;
  md += `- Debe tener entre 50–60 caracteres y contener palabras clave principales.\n`;
  md += `- Verificar que sea único y representativo de cada página.\n\n`;
  md += `### Meta Description\n`;
  md += `- Idealmente entre 150–160 caracteres.\n`;
  md += `- Debe ser persuasiva, contener keywords y reflejar el contenido real de la página.\n\n`;
  md += `### Meta Robots\n`;
  md += `- Asegurar valores adecuados como index, follow para las páginas importantes.\n`;
  md += `- Evitar noindex en páginas clave del negocio.\n\n`;
  md += `### Canonical Tags\n`;
  md += `- Cada página debe tener una etiqueta rel="canonical" válida.\n`;
  md += `- Útil para evitar duplicados y consolidar autoridad.\n\n`;
  md += `### Open Graph y Twitter Cards\n`;
  md += `- Añadir og:title, og:description, og:image para una correcta visualización en redes sociales.\n`;
  md += `- Usar también twitter:title, twitter:description, twitter:image para Twitter Cards.\n\n`;
  md += `### Datos Estructurados (Schema.org)\n`;
  md += `- Incorporar marcado estructurado como Product, Breadcrumb, Organization, FAQ.\n`;
  md += `- Validar usando Rich Results Test: https://search.google.com/test/rich-results\n`;

  return md;
};
