const fs = require('fs');
const path = require('path');

function generarResumenTecnicoSEO(lighthousePath) {
  const data = JSON.parse(fs.readFileSync(lighthousePath, 'utf-8'));
  const audits = data.audits || {};

  // Extraer métricas Core Web Vitals
  const lcp = audits['largest-contentful-paint']?.displayValue || 'No disponible';
  const lcpScore = audits['largest-contentful-paint']?.score ?? null;
  const cls = audits['cumulative-layout-shift']?.displayValue || 'No disponible';
  const clsScore = audits['cumulative-layout-shift']?.score ?? null;
  const tbt = audits['total-blocking-time']?.displayValue || 'No disponible';
  const tbtScore = audits['total-blocking-time']?.score ?? null;

  // Imágenes
  const imageSavings = audits['uses-optimized-images']?.details?.overallSavingsBytes ?? 0;

  // Caché
  const cacheSavings = audits['uses-long-cache-ttl']?.details?.items?.length || 0;

  // JS
  const mainThread = audits['mainthread-work-breakdown']?.details?.items || [];
  const jsTime = mainThread.find(i => i.group === 'scriptEvaluation')?.duration || 0;
  const layoutTime = mainThread.find(i => i.group === 'layout')?.duration || 0;

  // Scripts de terceros
  const thirdPartyCount = audits['third-party-summary']?.details?.items?.length || 0;

  let md = `## 🧠 Diagnóstico Técnico SEO y Recomendaciones\n\n`;

  // CORE WEB VITALS
  md += `### 🔍 1. Core Web Vitals\n`;
  md += `| Métrica | Valor | Score |\n`;
  md += `|---------|-------|--------|\n`;
  md += `| LCP     | ${lcp} | ${lcpScore !== null ? lcpScore : '—'} |\n`;
  md += `| CLS     | ${cls} | ${clsScore !== null ? clsScore : '—'} |\n`;
  md += `| TBT     | ${tbt} | ${tbtScore !== null ? tbtScore : '—'} |\n\n`;

  // IMÁGENES
  md += `### 🖼️ 2. Optimización de Imágenes\n`;
  if (imageSavings > 100000) {
    md += `❌ Se detectó un ahorro potencial de **${(imageSavings / 1024).toFixed(0)} KB** por falta de compresión o formatos modernos.\n\n`;
    md += `**✅ Recomendación:** Usar WebP, compresión eficiente y responsive srcset/sizes.\n\n`;
  } else {
    md += `✅ No se detectaron problemas relevantes con las imágenes.\n\n`;
  }

  // CACHÉ
  md += `### 🗂️ 3. Políticas de Caché\n`;
  if (cacheSavings > 5) {
    md += `❌ Hay **${cacheSavings} recursos** sin política de caché eficiente.\n\n`;
    md += `**✅ Recomendación:** Usar encabezados Cache-Control con expiración.\n\n`;
  } else {
    md += `✅ Política de caché adecuada en la mayoría de los recursos.\n\n`;
  }

  // JS
  md += `### ⚙️ 4. Carga y ejecución de JavaScript\n`;
  md += `- Evaluación de scripts JS: **${Math.round(jsTime)} ms**\n`;
  md += `- Tiempo en layout/render: **${Math.round(layoutTime)} ms**\n\n`;
  md += `**✅ Recomendación:** Reducir dependencias, aplicar code splitting, priorizar carga útil.\n\n`;

  // TERCEROS
  md += `### 🎯 5. Scripts de Terceros\n`;
  if (thirdPartyCount > 5) {
    md += `❌ Se cargan más de **5 scripts** de terceros. Esto puede afectar rendimiento y SEO.\n\n`;
    md += `**✅ Recomendación:** Usar \`async\` o \`defer\`, y eliminar lo no crítico.\n\n`;
  } else {
    md += `✅ Uso razonable de scripts de terceros.\n\n`;
  }

  md += `---\n📝 *Este análisis fue generado automáticamente a partir del JSON de Lighthouse (PageSpeed API).*`;

  return md;
}

module.exports = generarResumenTecnicoSEO;
