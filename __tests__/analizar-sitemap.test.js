const axios = require('axios');
const xml2js = require('xml2js');

function extraerSeccion(url) {
  const parts = url.split('/');
  return parts.filter(Boolean).slice(2).join('/').split('?')[0] || 'home';
}

module.exports = async function analizarSitemap(url, verbose = false) {
  const sitemapUrl = `${url.replace(/\/$/, '')}/sitemap.xml`;
  let resultadoMd = `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n`;

  try {
    const res = await axios.get(sitemapUrl, { timeout: 10000 });
    resultadoMd += '✅ El sitemap está accesible y retornó código 200\n';

    const xml = res.data;
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);

    const urls = result.urlset?.url || [];
    const listaUrls = Array.isArray(urls) ? urls : [urls];

    const secciones = {};
    let contieneLastmod = false;
    let contieneChangefreq = false;
    let contienePriority = false;
    let ultimaFecha = '';

    const urlsTest = [];

    for (const entry of listaUrls) {
      const loc = entry.loc;
      const seccion = extraerSeccion(loc);

      secciones[seccion] = (secciones[seccion] || 0) + 1;

      if (loc.includes('test') || loc.includes('prueba') || loc.includes('dev')) {
        urlsTest.push(loc);
      }

      if (entry.lastmod) {
        contieneLastmod = true;
        ultimaFecha = ultimaFecha || entry.lastmod;
      }
      if (entry.changefreq) contieneChangefreq = true;
      if (entry.priority) contienePriority = true;
    }

    resultadoMd += `📦 Contiene **${listaUrls.length}** URLs\n`;
    resultadoMd += `🕒 Última fecha de modificación encontrada: **${ultimaFecha || 'No disponible'}**\n`;

    resultadoMd += '🔍 Etiquetas detectadas:\n';
    resultadoMd += `- \`<lastmod>\`: ${contieneLastmod ? '✅ Sí' : '❌ No'}\n`;
    resultadoMd += `- \`<changefreq>\`: ${contieneChangefreq ? '✅ Sí' : '❌ No'}\n`;
    resultadoMd += `- \`<priority>\`: ${contienePriority ? '✅ Sí' : '❌ No'}\n`;

    resultadoMd += `### 🧩 Secciones más representadas:\n`;
    Object.entries(secciones)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sec, count]) => {
        resultadoMd += `- \`${sec}\`: ${count} URLs\n`;
      });

    if (urlsTest.length > 0) {
      resultadoMd += `⚠️ **Advertencia:** Se detectaron **${urlsTest.length}** URLs que parecen ser de test o entorno de desarrollo:\n`;
      urlsTest.slice(0, 5).forEach(u => {
        resultadoMd += `- ${u}\n`;
      });
    }

    resultadoMd += `### 📌 Recomendaciones SEO para el sitemap\n`;
    resultadoMd += `- ✅ Usa \`<lastmod>\` para mejorar el rastreo eficiente de Google\n`;
    resultadoMd += `- ❗ Considera incluir \`<changefreq>\` para indicar frecuencia de actualización\n`;
    resultadoMd += `- ❗ Evalúa usar \`<priority>\` para destacar páginas clave\n`;
    resultadoMd += `- 🔍 Elimina URLs con términos como “test”, “prueba”, “dev” si no deberían estar indexadas\n`;
    resultadoMd += `- 🔥 Evita páginas con \`noindex\`, redirecciones o errores 4xx/5xx en tu sitemap\n`;
    resultadoMd += `- 📦 Divide el sitemap si supera las 50.000 URLs o 50MB y usa un índice\n`;
    resultadoMd += `- 🎯 Añade sitemaps específicos para imágenes o videos si aplica al contenido del sitio\n`;

    return resultadoMd;
  } catch (err) {
    return `# 🗺️ Análisis de Sitemap para ${sitemapUrl}\n❌ Error al acceder al sitemap: ${err.message}`;
  }
};
