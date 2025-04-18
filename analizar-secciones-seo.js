
const fs = require('fs');
const cheerio = require('cheerio');

function evaluarSeccion($, seccion) {
  const texto = $(seccion).text().trim();
  const palabras = texto.split(/\s+/).filter(w => w.length > 3);
  const scoreTexto = palabras.length;

  const h1 = $(seccion).find('h1').length;
  const h2 = $(seccion).find('h2').length;
  const imgs = $(seccion).find('img').length;
  const altFaltantes = $(seccion).find('img:not([alt])').length;

  const enlaces = $(seccion).find('a').length;
  const scoreSEO = (h1 * 2 + h2 + enlaces) - altFaltantes;

  return {
    tag: $(seccion)[0].tagName || 'div',
    resumen: texto.slice(0, 100).replace(/\s+/g, ' ') + '...',
    scoreTexto,
    scoreSEO,
    h1,
    h2,
    enlaces,
    imgs,
    altFaltantes
  };
}

module.exports = function analizarSeccionesSeo(htmlPath) {
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(rawHtml);
  const secciones = $('main, section, div[id], article').toArray();

  const analisis = secciones.map(seccion => evaluarSeccion($, seccion));
  const ordenado = analisis.sort((a, b) => (a.scoreSEO + a.scoreTexto) - (b.scoreSEO + b.scoreTexto));
  return ordenado;
};
