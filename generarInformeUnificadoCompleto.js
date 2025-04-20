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

  // 🔹 Puntajes Lighthouse
  const lighthousePath = path.join(carpeta, 'lighthouse.json');
  let lighthouseData = null;
  if (fs.existsSync(lighthousePath)) {
    lighthouseData = JSON.parse(fs.readFileSync(lighthousePath, 'utf-8'));

    const seo = lighthouseData.categories?.seo?.score ?? null;
    const performance = lighthouseData.categories?.performance?.score ?? null;
    const accessibility = lighthouseData.categories?.accessibility?.score ?? null;

    const puntajes = [
      { categoria: 'SEO', valor: seo !== null ? `${seo * 100} / 100` : 'No disponible' },
      { categoria: 'Rendimiento', valor: performance !== null ? `${performance * 100} / 100` : 'No disponible' },
      { categoria: 'Accesibilidad', valor: accessibility !== null ? `${accessibility * 100} / 100` : 'No disponible' }
    ];

    const tablaHTML = `
      <table>
        <thead>
          <tr><th>Categoría</th><th>Puntaje</th></tr>
        </thead>
        <tbody>
          ${puntajes.map(p => `<tr><td>${p.categoria}</td><td>${p.valor}</td></tr>`).join('\n')}
        </tbody>
      </table>
    `;

    homeResult.push({
      titulo: 'Puntajes Lighthouse',
      contenido: tablaHTML
    });
  }

  return { homeResult };
}

module.exports = {
  generarInformeUnificadoCompleto
};
