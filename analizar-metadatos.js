
const fs = require('fs');
const cheerio = require('cheerio');

module.exports = function analizarMetadatos(htmlPath) {
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(rawHtml);

  const head = $('head');

  const metaTitle = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';

  const openGraphTags = ['og:title', 'og:description', 'og:image'].map(name =>
    $(`meta[property="${name}"]`).attr('content')
  );

  const twitterTags = ['twitter:title', 'twitter:description', 'twitter:image'].map(name =>
    $(`meta[name="${name}"]`).attr('content')
  );

  const ldJson = $('script[type="application/ld+json"]').length;

  return [
    {
      campo: 'Meta Title',
      cumple: metaTitle.length >= 10 && metaTitle.length <= 70,
      gravedad: 'media',
      detalle: metaTitle
    },
    {
      campo: 'Meta Description',
      cumple: metaDescription.length >= 50 && metaDescription.length <= 180,
      gravedad: 'media',
      detalle: metaDescription
    },
    {
      campo: 'Meta Robots',
      cumple: metaRobots.toLowerCase().includes('index') && metaRobots.toLowerCase().includes('follow'),
      gravedad: 'media',
      detalle: metaRobots
    },
    {
      campo: 'Canonical Tags',
      cumple: !!canonical,
      gravedad: 'alta',
      detalle: canonical
    },
    {
      campo: 'Open Graph (og:title, og:description, og:image)',
      cumple: openGraphTags.every(t => !!t),
      gravedad: 'media',
      detalle: openGraphTags.filter(Boolean).join(' | ')
    },
    {
      campo: 'Datos estructurados (Schema.org)',
      cumple: ldJson > 0,
      gravedad: 'baja',
      detalle: `${ldJson} bloques detectados`
    }
  ];
};
