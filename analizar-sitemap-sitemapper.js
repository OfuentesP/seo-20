
const Sitemapper = require('sitemapper');

module.exports = async function analizarSitemapConSitemapper(url) {
  const sitemap = new Sitemapper({ timeout: 15000 });
  const result = {
    total: 0,
    ultimaFechaModificacion: '',
    urls: [],
  };

  try {
    const data = await sitemap.fetch(`${url}/sitemap.xml`);
    result.total = data.sites.length;
    result.urls = data.sites;

    // Extraer <lastmod> más reciente si existe
    const fechas = data.sites
      .map(u => u.lastmod)
      .filter(Boolean)
      .map(d => new Date(d).getTime());
      
    if (fechas.length > 0) {
      result.ultimaFechaModificacion = new Date(Math.max(...fechas)).toISOString();
    }
  } catch (err) {
    console.warn('⚠️ Error al analizar sitemap con sitemapper:', err.message);
  }

  return result;
};
