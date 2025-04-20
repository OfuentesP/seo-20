// preparar-informe.js
const { execSync } = require('child_process');

try {
  console.log('🧹 Ejecutando scraping de texto...');
  execSync('node scrape-text.js', { stdio: 'inherit' });

  console.log('📊 Ejecutando análisis de metadatos enriquecidos...');
  execSync('node analizar-metadatos.js', { stdio: 'inherit' });

  console.log('🧩 Ejecutando análisis de secciones SEO...');
  execSync('node analizar-secciones-seo.js', { stdio: 'inherit' });

  console.log('📄 Ejecutando generación del informe final...');
  execSync('node seo20-completo.js', { stdio: 'inherit' });

  console.log('✅ Informe completo generado con éxito.');
} catch (err) {
  console.error('❌ Error durante la preparación del informe:', err.message);
  process.exit(1);
}
