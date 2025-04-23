const fs = require('fs');
const path = require('path');

async function generarInformeUnificadoCompleto({ url, textoScraping, lighthouse }) {
  const fecha = new Date().toISOString().split('T')[0];
  const dominio = new URL(url).hostname.replace(/^www\./, '');
  const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);

  const homeResult = [];

  // 🔹 Texto scraping
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

  // 🔹 Lighthouse puntajes
  if (lighthouse?.categories) {
    const categories = lighthouse.categories;
    const puntajes = [
      { categoria: 'SEO', valor: categories.seo?.score != null ? `${categories.seo.score * 100} / 100` : 'No disponible' },
      { categoria: 'Rendimiento', valor: categories.performance?.score != null ? `${categories.performance.score * 100} / 100` : 'No disponible' },
      { categoria: 'Accesibilidad', valor: categories.accessibility?.score != null ? `${categories.accessibility.score * 100} / 100` : 'No disponible' }
    ];

    const tabla = `| Categoría      | Puntaje     |
|----------------|-------------|
${puntajes.map(p => `| ${p.categoria.padEnd(14)} | ${p.valor} |`).join('\n')}`;

    homeResult.push({
      titulo: 'Puntajes Lighthouse',
      contenido: tabla
    });
  }

  // 🔹 Secciones si están disponibles
  const seccionesPath = path.join(carpeta, 'secciones.json');
  if (fs.existsSync(seccionesPath)) {
    const secciones = JSON.parse(fs.readFileSync(seccionesPath, 'utf-8'));
    homeResult.push({
      titulo: 'Secciones identificadas en el home',
      contenido: secciones.join('\n')
    });
  }

  // 🔹 Metadata si está
  const metadataPath = path.join(carpeta, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    homeResult.push({
      titulo: 'Metadatos',
      contenido: JSON.stringify(metadata, null, 2)
    });
  }

  // 🔹 Render final
  let markdown = `# 📊 Informe SEO Consolidado – ${dominio}\n\n`;
  markdown += `_Fecha: ${fecha}_\n\n`;

  markdown += `## 🏠 Análisis del Home\n\n`;
  for (const bloque of homeResult) {
    markdown += `### ${bloque.titulo}\n${bloque.contenido}\n\n`;
  }

  return markdown;
}

module.exports = {
  generarInformeUnificadoCompleto
};
