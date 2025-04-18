
const fs = require('fs');
const path = require('path');

module.exports = function generarInformeUnificadoCompleto({ homeResult, sitemapMd, paginas, urls404, sitio, fecha }) {
  let md = `# 📊 Informe SEO Consolidado – ${sitio}\n\n`;
  md += `_Fecha: ${fecha}_\n\n---\n`;

  // Imagen del Home si está disponible
  const screenshotPath = path.join('screenshot-home.png');
  if (fs.existsSync(screenshotPath)) {
    md += `\n## 🖼️ Vista General del Sitio (Home)\n\n`;
    md += `![Vista del sitio](${screenshotPath})\n\n`;
  }

  // 1. Análisis del Home
  md += `\n## 🏠 Análisis del Home\n\n`;
  if (homeResult && homeResult.lighthouse) {
    const seoScore = Math.round(homeResult.lighthouse.categories.seo.score * 100);
    md += `**Puntaje SEO (Lighthouse):** ${seoScore} / 100\n\n`;

    const issues = Object.values(homeResult.lighthouse.audits)
      .filter(a => a.score !== 1 && a.scoreDisplayMode !== 'notApplicable');
    if (issues.length > 0) {
      md += `### Problemas detectados (con recomendaciones):\n\n`;
      md += `| Problema | Descripción | Propuesta Técnica | Valor para el Negocio |\n`;
      md += `|----------|-------------|-------------------|------------------------|\n`;
      for (const item of issues) {
        const score = item.score !== null ? Math.round(item.score * 100) : 'N/A';
        md += `| ${item.title} (${score}) | ${item.description?.replace(/\|/g, '') || '-'} | Revisar ${item.id} | Mejora de posicionamiento/experiencia |\n`;
      }
    }
  }

  if (homeResult && homeResult.scraping) {
    const palabras = homeResult.scraping.split(/\s+/).filter(w => w.length > 3);
    const topWords = {};
    palabras.forEach(p => topWords[p] = (topWords[p] || 0) + 1);
    const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 10);
    md += `\n**Top palabras visibles del Home:** ${top.map(w => w[0]).join(', ')}\n`;
  }

  // 2. Revisión de Secciones SEO
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

  // 3. Informe del sitemap
  md += `\n---\n\n## 🗺️ Revisión del Sitemap\n\n`;
  md += sitemapMd || '❌ No disponible';

  // 4. Análisis de páginas individuales
  if (paginas.length > 0) {
    md += `\n---\n\n## 📄 Análisis de Páginas por Sitemap\n\n`;
    paginas.forEach((p, i) => {
      md += `\n### ${i + 1}. ${p.url}\n`;
      if (p.lighthouse) {
        const score = Math.round(p.lighthouse.categories.seo.score * 100);
        md += `- Puntaje SEO: ${score} / 100\n`;
      }
      if (p.texto) {
        const palabras = p.texto.split(/\s+/).filter(w => w.length > 3);
        const topWords = {};
        palabras.forEach(p => topWords[p] = (topWords[p] || 0) + 1);
        const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 5);
        md += `- Palabras clave visibles: ${top.map(w => w[0]).join(', ')}\n`;
      }
    });
  }

  // 5. URLs con error
  if (urls404 && urls404.length > 0) {
    md += `\n---\n\n## ⚠️ URLs con Error 404\n\n`;
    urls404.forEach(u => {
      md += `- ${u}\n`;
    });
  }

  return md;
};
