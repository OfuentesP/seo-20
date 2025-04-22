const axios = require('axios');
const cheerio = require('cheerio');

module.exports.analizarSitemap = async function analizarSitemap(siteUrl) {
  const sitemapUrl = siteUrl.endsWith('/') ? siteUrl + 'sitemap.xml' : siteUrl + '/sitemap.xml';
  let md = `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n\n`;

  try {
    const res = await axios.get(sitemapUrl, { timeout: 10000 });
    const $ = cheerio.load(res.data, { xmlMode: true });

    // 🧠 Detectar tipo de sitemap
    if ($('urlset').length > 0) {
      md += `✅ El sitemap es de tipo <urlset> y retornó código 200\n`;

      const urls = $('url');
      const urlLocations = urls.map((i, el) => $(el).find('loc').text()).get();
      const total = urls.length;
      md += `📦 Contiene **${total}** URLs\n\n`;

      const fechas = urls.map((i, el) => $(el).find('lastmod').text()).get().filter(Boolean);
      const ultimaFecha = fechas.length > 0 ? fechas.sort().reverse()[0] : 'No disponible';
      md += `🕒 Última fecha de modificación encontrada: **${ultimaFecha}**\n`;

    } else if ($('sitemapindex').length > 0) {
      md += `✅ El sitemap es un índice (<sitemapindex>) y retornó código 200\n`;

      const sitemaps = $('sitemap');
      const total = sitemaps.length;
      md += `📦 Contiene **${total}** sitemaps secundarios\n\n`;

      const fechas = sitemaps.map((i, el) => $(el).find('lastmod').text()).get().filter(Boolean);
      const ultimaFecha = fechas.length > 0 ? fechas.sort().reverse()[0] : 'No disponible';
      md += `🕒 Última fecha de modificación entre los sitemaps: **${ultimaFecha}**\n`;

    } else {
      throw new Error("Formato no reconocido: no es <urlset> ni <sitemapindex>");
    }

  } catch (err) {
    md += `❌ Error al procesar la respuesta del sitemap. Error: ${err.message}`;
  }

  return md;
};
