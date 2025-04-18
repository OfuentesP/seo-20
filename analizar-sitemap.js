const axios = require('axios');
const cheerio = require('cheerio');

async function analizarSitemap(siteUrl) {
  const sitemapUrl = siteUrl.endsWith('/') ? siteUrl + 'sitemap.xml' : siteUrl + '/sitemap.xml';
  let md = `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n\n`;

  try {
    const res = await axios.get(sitemapUrl, { timeout: 10000 });
    const $ = cheerio.load(res.data, { xmlMode: true });

    md += `✅ El sitemap está accesible y retornó código 200.\n\n`;

    const urls = $('url');
    const total = urls.length;
    md += `📦 Contiene **${total}** URLs.\n\n`;

    // Última fecha
    const fechas = urls.map((i, el) => $(el).find('lastmod').text()).get().filter(Boolean);
    const ultimaFecha = fechas.length > 0 ? fechas.sort().reverse()[0] : 'No disponible';
    md += `🕒 Última fecha de modificación encontrada: **${ultimaFecha}**\n\n`;

    // Chequeo etiquetas
    const tieneChangefreq = $('changefreq').length > 0;
    const tienePriority = $('priority').length > 0;

    md += `🔍 Etiquetas detectadas:\n`;
    md += `- \`<lastmod>\`: ${fechas.length > 0 ? '✅ Sí' : '❌ No'}\n`;
    md += `- \`<changefreq>\`: ${tieneChangefreq ? '✅ Sí' : '❌ No'}\n`;
    md += `- \`<priority>\`: ${tienePriority ? '✅ Sí' : '❌ No'}\n\n`;

    // Agrupación por sección
    const secciones = {};
    let urlsConTest = [];

    urls.each((_, el) => {
      const loc = $(el).find('loc').text();
      const path = loc.replace(siteUrl, '').split('/')[1] || 'home';

      secciones[path] = (secciones[path] || 0) + 1;

      if (/test|prueba|dev/i.test(loc)) {
        urlsConTest.push(loc);
      }
    });

    md += `### 🧩 Secciones más representadas:\n`;
    for (const [sec, count] of Object.entries(secciones).sort((a, b) => b[1] - a[1])) {
      md += `- \`${sec}\`: ${count} URLs\n`;
    }

    // Advertencia por URLs "test"
    if (urlsConTest.length > 0) {
      md += `\n⚠️ **Advertencia:** Se detectaron **${urlsConTest.length}** URLs que parecen ser de test o entorno de desarrollo:\n`;
      const ejemplos = urlsConTest.slice(0, 5);
      ejemplos.forEach(u => {
        md += `- ${u}\n`;
      });
      if (urlsConTest.length > 5) {
        md += `...y ${urlsConTest.length - 5} más.\n`;
      }
    }

    // Recomendaciones SEO
    md += `\n### 📌 Recomendaciones SEO para el sitemap\n`;
    md += `- ✅ Usa \`<lastmod>\` para mejorar el rastreo eficiente de Google.\n`;
    md += `- ${!tieneChangefreq ? '❗' : '✅'} Considera incluir \`<changefreq>\` para indicar frecuencia de actualización.\n`;
    md += `- ${!tienePriority ? '❗' : '✅'} Evalúa usar \`<priority>\` para destacar páginas clave.\n`;
    md += `- 🔍 Elimina URLs con términos como “test”, “prueba”, “dev” si no deberían estar indexadas.\n`;
    md += `- 🔥 Evita páginas con \`noindex\`, redirecciones o errores 4xx/5xx en tu sitemap.\n`;
    md += `- 📦 Divide el sitemap si supera las 50.000 URLs o 50MB y usa un índice.\n`;
    md += `- 🎯 Añade sitemaps específicos para imágenes o videos si aplica al contenido del sitio.\n`;

  } catch (err) {
    md += `❌ No se pudo acceder al sitemap: ${err.message}`;
  }

  return md;
}
