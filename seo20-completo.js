const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generarBloqueLighthouse } = require('./modulos/lighthouse');



const url = process.argv[2];

if (!url || !url.startsWith('http')) {
  console.error('❌ URL inválida. Usa: node seo20-completo.js https://tusitio.cl');
  process.exit(1);
}

const dominio = new URL(url).hostname.replace(/^www\./, '');
const fecha = new Date().toISOString().split('T')[0];
const carpeta = path.join(__dirname, 'resultados', `${fecha}_${dominio}`);

// Asegurar carpeta de resultados
if (!fs.existsSync(carpeta)) {
  fs.mkdirSync(carpeta, { recursive: true });
}

// Paso 1: Ejecutar Lighthouse (ejemplo básico, puede cambiar según tu flujo)
const pathLighthouseJson = path.join(carpeta, 'lighthouse.json');
console.log('🚀 Ejecutando Lighthouse...');
execSync(`npx lighthouse ${url} --output=json --output-path="${pathLighthouseJson}" --chrome-flags="--headless"`, {
  stdio: 'inherit',
});

console.log('✅ Lighthouse completado.');

// Paso 2: Generar bloque HTML del informe
console.log('🧩 Generando bloque Lighthouse...');
const bloqueLighthouse = generarBloqueLighthouse(pathLighthouseJson);

// Paso 3: Guardar HTML temporal (opcional, para debug)
fs.writeFileSync(path.join(carpeta, 'lighthouse-bloque.html'), bloqueLighthouse, 'utf-8');

// Paso 4: Insertar en flujo de PDF (ejemplo genérico)
const htmlFinal = `
<html>
<head><meta charset="utf-8"><title>Informe SEO</title></head>
<body>
  <h1>Informe SEO para ${dominio}</h1>
  ${bloqueLighthouse}
</body>
</html>
`;

fs.writeFileSync(path.join(carpeta, 'informe.html'), htmlFinal, 'utf-8');

console.log('📄 Informe HTML generado en:', path.join(carpeta, 'informe.html'));
