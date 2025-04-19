
const fs = require('fs');
const cheerio = require('cheerio');

// Configuration object for metadata analysis
const config = {
  titleMinLength: 10,
  titleMaxLength: 70,
  descriptionMinLength: 50,
  descriptionMaxLength: 180,
  // Array of required Open Graph tags. Adjust as needed.
  requiredOpenGraphTags: ['og:title', 'og:description', 'og:image'],
  severities: {
    metaTitle: 'media',
    metaDescription: 'media',
    metaRobots: 'media',
    canonical: 'alta',
    openGraph: 'media',
    structuredData: 'baja',
    viewport: 'media',
    lang: 'alta'
  }
};

module.exports = function analizarMetadatos(htmlPath) {
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(rawHtml);

  const head = $('head');

  const metaTitle = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || ''; // Added viewport check
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const lang = $('html').attr('lang') || ''; // Added language attribute check

  // Extract Open Graph tags based on the required tags in the config
  const openGraphTags = config.requiredOpenGraphTags.map(name => $(`meta[property="${name}"]`).attr('content'));

  const ldJson = $('script[type="application/ld+json"]').length;

  const report = [];

  // Check Meta Title length against configured limits
  report.push({
    campo: 'Meta Title',
    cumple: metaTitle.length >= config.titleMinLength && metaTitle.length <= config.titleMaxLength,
    gravedad: config.severities.metaTitle,
    detalle: metaTitle
  });

  // Check Meta Description length against configured limits
  report.push({
    campo: 'Meta Description',
    cumple: metaDescription.length >= config.descriptionMinLength && metaDescription.length <= config.descriptionMaxLength,
    gravedad: config.severities.metaDescription,
    detalle: metaDescription
  });

  // Check Meta Robots for noindex or nofollow directives
  let robotsResult = true;
  let robotsDetail = metaRobots;
  if (metaRobots.toLowerCase().includes('noindex') || metaRobots.toLowerCase().includes('nofollow')) {
    robotsResult = false;
    robotsDetail = `Directiva robots desfavorable encontrada: ${metaRobots}`;
  }

  report.push({
    campo: 'Meta Robots',
    cumple: robotsResult,
    gravedad: config.severities.metaRobots,
    detalle: robotsDetail
  });

  // Check for Canonical URL
  report.push({
    campo: 'Canonical Tags',
    cumple: !!canonical,
    gravedad: config.severities.canonical,
    detalle: canonical
  });

  // Check for required Open Graph tags
  let openGraphResult = true;
  let openGraphDetail = openGraphTags.filter(Boolean).join(' | ');
  if (!openGraphTags.every(t => !!t)) {
    openGraphResult = false;
    openGraphDetail = `Faltan algunas etiquetas Open Graph requeridas: ${config.requiredOpenGraphTags.filter((_, index) => !openGraphTags[index]).join(', ')}`;
  }

  report.push({
    campo: `Open Graph (${config.requiredOpenGraphTags.join(', ')})`,
    cumple: openGraphResult,
    gravedad: config.severities.openGraph,
    detalle: openGraphDetail
  });

  // Check for Structured Data (Schema.org)
  report.push({
    campo: 'Datos estructurados (Schema.org)',
    cumple: ldJson > 0,
    gravedad: config.severities.structuredData,
    detalle: `${ldJson} bloques detectados`
  });

  // Check for Viewport meta tag
  report.push({
    campo: 'Meta Viewport',
    cumple: !!viewport,
    gravedad: config.severities.viewport,
    detalle: viewport
  });

  // Check for language attribute in <html> tag
  report.push({
    campo: 'Atributo Lang en <html>',
    cumple: !!lang,
    gravedad: config.severities.lang,
    detalle: lang
  });

  return [
    ...report
  ]
};
