
const fs = require('fs');
const cheerio = require('cheerio');

// Configuration object for section analysis
const config = {
  // Weights for calculating the SEO score of a section
  scoreWeights: {
    h1: 2,
    h2: 1,
    enlaces: 1,
    altFaltantes: -1
  },
  // Severity levels for different aspects of the analysis
  severities: {
    scoreSEO: 'media',
    altFaltantes: 'media'
  },
  // Selector for identifying sections within the HTML
  seccionSelector: 'main, section, div[id], article'
};

// Function to evaluate a section's SEO attributes
function evaluarSeccion($, seccion) {
  const texto = $(seccion).text().trim();

  // More robust word counting, considering different languages
  const palabras = texto.split(/\b\w+\b/g).filter(Boolean);
  const scoreTexto = palabras.length; // Score based on word count

  // Count h1 and h2 headings
  const h1 = $(seccion).find('h1').length;
  const h2 = $(seccion).find('h2').length;
  // Count images and those missing alt text
  const altFaltantes = $(seccion).find('img:not([alt])').length;

  const enlaces = $(seccion).find('a').length;

  // Calculate SEO score using configured weights
  const scoreSEOWeighted = (h1 * config.scoreWeights.h1 + h2 * config.scoreWeights.h2 + enlaces * config.scoreWeights.enlaces) + (altFaltantes * config.scoreWeights.altFaltantes);

    return {
    // Section details
    tag: $(seccion)[0].tagName || 'div',
    resumen: texto.slice(0, 100).replace(/\s+/g, ' ') + '...',
    scoreTexto,
    scoreSEO,
    h1,
    h2,
    enlaces,
    altFaltantes,
    scoreSEOWeighted
  };
}

// Main function to analyze sections in an HTML file
module.exports = function analizarSeccionesSeo(htmlPath) {
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(rawHtml);

  // Use the configurable section selector to find sections
  const secciones = $(config.seccionSelector).toArray();

  // Analyze each section found
  const analisis = secciones.map(seccion => evaluarSeccion($, seccion));

  // Prepare the report with analysis results
  const report = [];

  analisis.forEach(seccion => {
    // Report sections with missing alt attributes in images
    if (seccion.altFaltantes > 0) {
      report.push({
        campo: `Sección con imágenes sin atributo alt: <${seccion.tag}>`,
        cumple: false,
        gravedad: config.severities.altFaltantes,
        detalle: `Sección: "${seccion.resumen}" - ${seccion.altFaltantes} imágenes sin "alt".`
      });
    }

    // Report sections based on weighted SEO score
    report.push({
      campo: `Análisis de sección <${seccion.tag}>`,
      cumple: seccion.scoreSEOWeighted > 0,
      gravedad: config.severities.scoreSEO,
      detalle: `Sección: "${seccion.resumen}" - Score SEO (ponderado): ${seccion.scoreSEOWeighted.toFixed(2)}, Score texto: ${seccion.scoreTexto}.`
    });
  });

  return [
    ...report
  ];
};
