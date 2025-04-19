
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')()
]);
const htmlMetadata = require('html-metadata');

module.exports = async function analizarMetadatosEnriquecidos(url) {
  const results = [];

  // 1. Metascraper
  try {
    const res = await fetch(url);
    const html = await res.text();
    const metadata = await metascraper({ html, url });

    results.push({
      campo: 'Título (metascraper)',
      cumple: metadata.title?.length >= 10,
      fuente: 'metascraper',
      gravedad: 'media',
      detalle: metadata.title || 'No detectado'
    });

    results.push({
      campo: 'Descripción (metascraper)',
      cumple: metadata.description?.length >= 50,
      fuente: 'metascraper',
      gravedad: 'media',
      detalle: metadata.description || 'No detectado'
    });

    results.push({
      campo: 'Imagen social (og:image)',
      cumple: Boolean(metadata.image),
      fuente: 'metascraper',
      gravedad: 'media',
      detalle: metadata.image || 'No detectada'
    });
  } catch (err) {
    results.push({
      campo: 'Metascraper general',
      cumple: false,
      fuente: 'metascraper',
      gravedad: 'alta',
      detalle: 'Falló al procesar el HTML'
    });
  }

  // 2. HTML-Metadata
  try {
    const metadata = await htmlMetadata(url);

    results.push({
      campo: 'Canonical',
      cumple: Boolean(metadata.general.canonical),
      fuente: 'html-metadata',
      gravedad: 'alta',
      detalle: metadata.general.canonical || 'No detectado'
    });

    results.push({
      campo: 'Twitter Card',
      cumple: metadata.twitter?.card || false,
      fuente: 'html-metadata',
      gravedad: 'media',
      detalle: metadata.twitter?.title || 'No detectada'
    });

    results.push({
      campo: 'Open Graph',
      cumple: Object.keys(metadata.openGraph || {}).length > 0,
      fuente: 'html-metadata',
      gravedad: 'media',
      detalle: metadata.openGraph?.title || 'No detectado'
    });
  } catch (err) {
    results.push({
      campo: 'html-metadata general',
      cumple: false,
      fuente: 'html-metadata',
      gravedad: 'media',
      detalle: 'Falló al procesar los metadatos'
    });
  }

  return results;
};
