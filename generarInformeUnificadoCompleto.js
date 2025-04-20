const fs = require('fs');
const path = require('path');

async function generarInformeUnificadoCompleto({ url, textoScraping }) {
  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);

  // ---------- HOME RESULT ----------
  const homeResult = [];

  // 🔹 Incluir texto visible del home (scraping)
  if (textoScraping && textoScraping.length > 0) {
    homeResult.push({
      titulo: 'Texto visible del home (scraping)',
      contenido: textoScraping.length > 1000 ? textoScraping.slice(0, 1000) + ' [...]' : textoScraping
    });
  } else {
    homeResult.push({
      titulo: 'Texto visible del home (scraping)',
      contenido: 'No se pudo extraer contenido visible del home o el archivo estaba vacío.'
    });
  }

  // 🔹 Metadata
  const metadataPath = path.join(carpeta, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    homeResult.push({
      titulo: 'Metadatos',
      contenido: JSON.stringify(metadata, null, 2)
    });
  }

  // 🔹 Secciones extraídas
  const seccionesPath = path.join(carpeta, 'secciones.json');
  if (fs.existsSync(seccionesPath)) {
    const secciones = JSON.parse(fs.readFileSync(seccionesPath, 'utf-8'));
    homeResult.push({
      titulo: 'Secciones identificadas en el home',
      contenido: secciones.join('\n')
    });
  }

  // 🔹 Resultado Lighthouse
  const lighthousePath = path.join(carpeta, 'lighthouse.json');
  let lighthouseData = null;
  if (fs.existsSync(lighthousePath)) {
    lighthouseData = JSON.parse(fs.readFileSync(lighthousePath, 'utf-8'));
    const score = lighthouseData.categories?.seo?.score ?? null;
    homeResult.push({
      titulo: 'Puntaje SEO de Lighthouse',
      contenido: score !== null ? `${score * 100}/100` : 'No disponible'
    });
  }

  // ---------- CONSTRUCCIÓN DE INFORME MARKDOWN ----------
  let markdown = `# Informe SEO\n\n`;
  markdown += `**URL:** ${url}\n`;
  markdown += `**Fecha:** ${fecha}\n\n`;

  markdown += `## Análisis del Home\n`;
  homeResult.forEach(bloque => {
    markdown += `### ${bloque.titulo}\n`;
    markdown += `${bloque.contenido}\n\n`;
  });

  // 🔹 Análisis Sitemap
  const sitemapPath = path.join(carpeta, 'sitemap-analysis.md');
  if (fs.existsSync(sitemapPath)) {
    markdown += `## Análisis del Sitemap\n`;
    markdown += fs.readFileSync(sitemapPath, 'utf-8');
    markdown += '\n\n';
  }

  // 🔹 Análisis Masivo
  const urlsPath = path.join(carpeta, 'analisis-por-url.md');
  if (fs.existsSync(urlsPath)) {
    markdown += `## Análisis por URL\n`;
    markdown += fs.readFileSync(urlsPath, 'utf-8');
    markdown += '\n\n';
  }

  // 🔹 URLs con error
  const erroresPath = path.join(carpeta, 'urls-con-errores.md');
  if (fs.existsSync(erroresPath)) {
    markdown += `## URLs con error 404 u otros\n`;
    markdown += fs.readFileSync(erroresPath, 'utf-8');
    markdown += '\n\n';
  }

  // 🔹 Recomendaciones SEO
  const recomendacionesPath = path.join(carpeta, 'recomendaciones.md');
  if (fs.existsSync(recomendacionesPath)) {
    markdown += `## Recomendaciones SEO\n`;
    markdown += fs.readFileSync(recomendacionesPath, 'utf-8');
    markdown += '\n\n';
  }

  return markdown;
}

module.exports = {
  generarInformeUnificadoCompleto
};
