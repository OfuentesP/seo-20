const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

async function extraerUrlsSitemap(siteUrl, modo = 'principales') {
  const sitemapUrl = siteUrl.endsWith('/') ? siteUrl + 'sitemap.xml' : siteUrl + '/sitemap.xml';
  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const res = await axios.get(sitemapUrl, { headers, timeout: 10000 });
    const $ = cheerio.load(res.data, { xmlMode: true });

    const urls = $('url');
    const todasLasUrls = [];

    urls.each((_, el) => {
      const loc = $(el).find('loc').text();
      if (!/test|prueba|dev/i.test(loc)) {
        todasLasUrls.push(loc);
      }
    });

    if (modo === 'todas') return todasLasUrls;

    const secciones = {};
    const domain = new URL(siteUrl).hostname;

    todasLasUrls.forEach(u => {
        const clean = u.replace(`https://${domain}`, '').replace(/^\/+/, '');
      const key = clean.split('/')[0] || 'home';
      if (!secciones[key]) secciones[key] = [];
      secciones[key].push(u);
    });

    const topSecciones = Object.entries(secciones).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    let topUrls = [];
    topSecciones.forEach(([_, lista]) => topUrls = topUrls.concat(lista));

    return topUrls.slice(0, 25);
  } catch (err) {
    console.error('❌ Error al extraer sitemap:', err.message);
    return [];
  }
}

module.exports = extraerUrlsSitemap;