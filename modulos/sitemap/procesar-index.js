const axios = require('axios');
const cheerio = require('cheerio');
const analizarResumenSitemap = require('../../analizar-sitemap-resumen');

async function procesarSitemapIndex(sitemapIndexUrl) {
  const resultados = [];

  try {
    const { data } = await axios.get(sitemapIndexUrl, { timeout: 10000 });
    const $ = cheerio.load(data, { xmlMode: true });

    const sitemaps = $('sitemap').map((i, el) => ({
      loc: $(el).find('loc').text(),
      lastmod: $(el).find('lastmod').text() || '—',
    })).get();

    for (const sm of sitemaps) {
      console.log(`🔄 Procesando sub-sitemap: ${sm.loc}`);
      try {
        const res = await axios.get(sm.loc, { timeout: 10000 });
        const $sub = cheerio.load(res.data, { xmlMode: true });

        const urls = $sub('url').map((i, el) => $sub(el).find('loc').text()).get();

        const resumen = await analizarResumenSitemap(urls);

        resultados.push({
          sitemap: sm.loc,
          total: resumen.total,
          errores404: resumen.conError404,
          estado: 'OK',
        });

      } catch (err) {
        resultados.push({
          sitemap: sm.loc,
          total: '—',
          errores404: '—',
          estado: '❌ Falla',
        });
      }
    }

  } catch (err) {
    console.error('❌ Error leyendo sitemap index:', err.message);
    return `<p>Error procesando sitemap index: ${err.message}</p>`;
  }

  // Generar tabla HTML
  let html = `
    <h2>🧩 Análisis de Sub-Sitemaps</h2>
    <table>
      <thead>
        <tr><th>Sitemap</th><th>Total URLs</th><th>Errores 404</th><th>Estado</th></tr>
      </thead>
      <tbody>
        ${resultados.map(r =>
          `<tr>
            <td><a href="${r.sitemap}" target="_blank">${r.sitemap}</a></td>
            <td>${r.total}</td>
            <td>${r.errores404}</td>
            <td>${r.estado === 'OK' ? '✅ OK' : '❌ Falla'}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>
  `;

  return html;
}

module.exports = procesarSitemapIndex;
