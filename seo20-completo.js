const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const generarReporteLighthouse = require('./modulos/lighthouse');

const execAsync = util.promisify(exec);

async function generarLighthouseJSON(url, outputPath) {
  const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --quiet --chrome-flags="--headless"`;
  await execAsync(command);
  console.log(`✅ Lighthouse JSON generado en: ${outputPath}`);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('❌ Debes ingresar una URL como argumento');
    process.exit(1);
  }

  const dominio = new URL(url).hostname.replace('www.', '');
  const fecha = new Date().toISOString().slice(0, 10);
  const carpetaResultado = `./resultados/${fecha}_${dominio}`;

  if (!fs.existsSync(carpetaResultado)) {
    fs.mkdirSync(carpetaResultado, { recursive: true });
  }

  console.log('📥 Iniciando análisis SEO para:', url);

  // 🔍 Paso 1: Generar Lighthouse JSON
  const jsonLighthousePath = path.join(carpetaResultado, 'lighthouse.json');
  try {
    console.log('🚦 Ejecutando Lighthouse...');
    await generarLighthouseJSON(url, jsonLighthousePath);
  } catch (error) {
    console.error('❌ Error ejecutando Lighthouse:', error.message);
    return;
  }

  // 📊 Paso 2: Generar reporte y PDF
  try {
    console.log('📊 Generando reporte Lighthouse...');
    const { pdf } = await generarReporteLighthouse(jsonLighthousePath);
    const nuevoPathPDF = path.join(carpetaResultado, 'lighthouse.pdf');
    fs.renameSync(pdf, nuevoPathPDF);
    console.log(`✅ Lighthouse PDF guardado en: ${nuevoPathPDF}`);
  } catch (error) {
    console.error('❌ Error generando Lighthouse PDF:', error.message);
  }

  console.log('🎉 Análisis completo.');
}

main();
