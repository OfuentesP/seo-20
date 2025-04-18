const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.surdiseno.cl';

axios.get(url).then((res) => {
  const $ = cheerio.load(res.data);

  // Extraer título
  const title = $('title').text();

  // Meta descripción
  const metaDesc = $('meta[name="description"]').attr('content') || 'No encontrada';

  // H1 y H2
  const h1 = $('h1').first().text().trim() || 'No encontrado';
  const h2s = [];
  $('h2').each((i, el) => {
    h2s.push($(el).text().trim());
  });

  // Imágenes y alt
  const images = [];
  $('img').each((i, el) => {
    images.push({
      src: $(el).attr('src'),
      alt: $(el).attr('alt') || 'Sin texto alternativo'
    });
  });

  // Construimos el JSON
  const seoData = {
    url,
    title,
    meta_description: metaDesc,
    h1,
    h2: h2s,
    images: images.slice(0, 20) // Limita para que no sea muy grande
  };

  // Guardamos en archivo
  fs.writeFileSync('seo-onpage-surdiseno.json', JSON.stringify(seoData, null, 2));
  console.log('✅ Informe SEO on-page guardado como seo-onpage-surdiseno.json');

}).catch((err) => {
  console.error('❌ Error al cargar la URL:', err.message);
});
