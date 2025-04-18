
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { execSync } = require('child_process');
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

  // 3. seo-analyzer
  try {
    const output = execSync(`seo-analyzer -u ${url} --json`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    const errores = data.result?.issues?.length || 0;

    results.push({
      campo: 'Errores estructurales (seo-analyzer)',
      cumple: errores === 0,
      fuente: 'seo-analyzer',
      gravedad: errores > 5 ? 'alta' : errores > 0 ? 'media' : 'baja',
      detalle: `${errores} problemas encontrados`
    });
  } catch (err) {
    results.push({
      campo: 'seo-analyzer',
      cumple: false,
      fuente: 'seo-analyzer',
      gravedad: 'media',
      detalle: 'Falló la ejecución o análisis'
    });
  }

  return results;
};
