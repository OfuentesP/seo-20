const fs = require('fs');
const path = require('path');

module.exports = function generarInformeUnificadoCompleto({
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

  // 2. Reporte Técnico
  md += `\n---\n\n## 🔍 Reporte Técnico SEO (Lighthouse + Observaciones)\n\n`;
  md += `| Problema Detectado | Detalle Técnico | Impacto para el Negocio |\n`;
  md += `|--------------------|-----------------|--------------------------|\n`;
  md += `| Faltan atributos alt en imágenes | Muchas imágenes no tienen alt, lo que impide accesibilidad y rastreo. | Pérdida de posicionamiento en imágenes, accesibilidad reducida. |\n`;
  md += `| Falta de texto estructurado en secciones clave | Elementos visuales sin HTML que los represente. | Dificulta que Google comprenda la jerarquía del contenido. |\n`;
  md += `| Tiempos de respuesta variables | Lighthouse detectó diferencias altas en tiempo inicial de carga. | Puede impactar rebote y conversión. |\n`;

  // 3. Texto visible del Home
  if (homeResult.scraping) {
    const palabras = homeResult.scraping.split(/\s+/).filter(w => w.length > 3);
    const topWords = {};
    palabras.forEach(p => topWords[p] = (topWords[p] || 0) + 1);
    const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 10);
    md += `\n---\n\n**Top palabras visibles del Home:** ${top.map(w => w[0]).join(', ')}\n`;
  }

  // 4. Recomendaciones por Zona Visual
  md += `\n---\n\n## 🧩 Recomendaciones por Zona Visual\n\n`;
  md += `| Zona visual        | ¿Está en el HTML? | Oportunidades SEO |\n`;
  md += `|--------------------|-------------------|--------------------|\n`;
  md += `| Hero / Banner      | ❌                | Agregar <h1> con palabras clave y llamado a la acción. |\n`;
  md += `| Carrusel de ofertas| ❌                | Incluir títulos HTML descriptivos y links accesibles. |\n`;
  md += `| Beneficios / features | ✅           | Asegurar estructura con h2 y listas. |\n`;
  md += `| Footer             | ✅                | Verificar presencia de enlaces internos y contenido rastreable. |\n`;

  // 5. Análisis SEO por Sección
  if (homeResult.secciones?.length > 0) {
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

  // 6. Análisis del Sitemap
  if (sitemapTotal > 0) {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `| Total URLs | Con 'test' | Con 'prueba' | Errores 404 |\n`;
    md += `|------------|------------|--------------|-------------|\n`;
    md += `| ${sitemapTotal} | {TEST} | {PRUEBA} | {ERROR404} |\n\n`;
    if (sitemapLastmod) md += `🕒 Última fecha de modificación encontrada: ${sitemapLastmod}\n\n`;
    md += sitemapMd || '❌ No disponible';
  } else {
    md += `\n---\n\n## 🗺️ Análisis Técnico del Sitemap\n\n`;
    md += `❌ No se encontró un sitemap accesible para este sitio. Esto es un problema grave de SEO, ya que impide que los motores de búsqueda indexen correctamente el sitio.\n\n`;
    md += `### 📌 Recomendación\n`;
    md += `Implementa un sitemap.xml accesible en la ruta /sitemap.xml que contenga todas las URLs clave de tu sitio.\n\n`;
    if (insightsIA?.includes('sitemap')) {
      md += `📎 Este tema también fue identificado como relevante en las recomendaciones generadas por IA.\n`;
    }
  }

  // 7. Metadatos enriquecidos
  md += `\n---\n\n## 🏷️ Metadatos del Sitio Web\n\n`;

  const camposEsperados = [
    { campo: 'Título (metascraper)', alias: 'Meta Title' },
    { campo: 'Descripción (metascraper)', alias: 'Meta Description' },
    { campo: 'Imagen social (og:image)', alias: 'Open Graph Image' },
    { campo: 'Canonical', alias: 'Canonical Tag' },
    { campo: 'Twitter Card', alias: 'Twitter Card' },
    { campo: 'Open Graph', alias: 'Open Graph' },
    { campo: 'Errores estructurales (seo-analyzer)', alias: 'Datos estructurados' }
  ];

  md += `| Metadato            | Presente | Detalle                     | Fuente         | Gravedad |\n`;
  md += `|---------------------|----------|-----------------------------|----------------|----------|\n`;

  const advertencias = [];

  if (homeResult.enriched && Array.isArray(homeResult.enriched)) {
    for (const esperado of camposEsperados) {
      const encontrado = homeResult.enriched.find(e => e.campo === esperado.campo);
      if (encontrado) {
        md += `| ${esperado.alias} | ${encontrado.cumple ? '✔️' : '❌'} | ${encontrado.detalle || 'N/A'} | ${encontrado.fuente} | ${encontrado.gravedad} |\n`;
        if (!encontrado.cumple && ['Canonical', 'Open Graph', 'Errores estructurales (seo-analyzer)'].includes(encontrado.campo)) {
          advertencias.push(`🚨 Falta ${esperado.alias}: importante para indexación y visibilidad en buscadores/redes.`);
        }
      } else {
        md += `| ${esperado.alias} | ❌ | No detectado | - | Alta |\n`;
        advertencias.push(`🚨 No se detectó ${esperado.alias}: posible impacto en SEO.`);
      }
    }
  } else {
    md += `| Todos | ❌ | No se pudo analizar | - | Alta |\n`;
  }

  if (advertencias.length > 0) {
    md += `\n### ⚠️ Advertencias SEO sobre Metadatos\n`;
    advertencias.forEach(a => md += `- ${a}\n`);
  }

  // 8. Recomendaciones IA (opcional)
  if (insightsIA) {
    md += `\n---\n\n## 🤖 Recomendaciones IA (Gemini)\n\n`;
    md += `${insightsIA}\n`;
  }

  return md;
};
