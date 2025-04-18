const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const scrape = require('./scrape-text');
const generatePdfFromMd = require('./utils/pdf-generator');
const extraerUrlsSitemap = require('./extraer-urls-sitemap');

async function analizarMultiplesUrls(urls, folderName) {
  const resultados = [];
  const urlsFallidas = [];

  for (let i = 0; i < urls.length; i++) {
    const currentUrl = urls[i];
    const nombreLimpio = currentUrl.replace(/^https?:\/\//, '').replace(/[^\w]/g, '-').slice(0, 80);
    const subfolder = path.join(folderName, `pagina-${i + 1}-${nombreLimpio}`);
    fs.mkdirSync(subfolder, { recursive: true });

    console.log(`\n📄 [${i + 1}/${urls.length}] Verificando: ${currentUrl}`);

    try {
      const head = await require('axios').head(currentUrl, { timeout: 8000 });
      if (head.status === 404) throw new Error('404');
    } catch (err) {
      console.warn(`❌ URL inválida o con error 404: ${currentUrl}`);
      urlsFallidas.push(currentUrl);
      continue;
    }

    try {
      execSync(`lighthouse ${currentUrl} --output json --output-path=${path.join(subfolder, 'report.json')} --only-categories=seo --chrome-flags="--headless"`);
    } catch (err) {
      console.warn(`⚠️ Lighthouse falló en: ${currentUrl}`);
    }

    try {
      await scrape(currentUrl, path.join(subfolder, 'texto-visible.txt'));
    } catch (err) {
      console.warn(`⚠️ Scraping falló en: ${currentUrl}`);
    }

    resultados.push({ url: currentUrl, folder: subfolder });
  }

  return { exitosas: resultados, fallidas: urlsFallidas };
}

(async () => {
  const url = prompt('🔍 Ingresa la URL del sitio: ').trim();
  if (!url.startsWith('http')) {
    console.error('❌ URL inválida. Debe comenzar con http o https.');
    return;
  }

  const modo = prompt('🗺️ ¿Qué deseas analizar?\n1) Solo páginas principales\n2) Todas las URLs\n> ').trim();
  const urlsAAnalizar = await extraerUrlsSitemap(url, modo === '2' ? 'todas' : 'principales');

  if (urlsAAnalizar.length === 0) {
    console.error('❌ No se encontraron URLs válidas en el sitemap.');
    return;
  }

  const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[/:]/g, '-');
  const folderName = `resultados/${new Date().toISOString().slice(0, 10)}-${cleanDomain}`;
  fs.mkdirSync(folderName, { recursive: true });

  const { exitosas, fallidas } = await analizarMultiplesUrls(urlsAAnalizar, folderName);

  let finalMd = `# 📊 Informe SEO Consolidado – ${url}\n\n`;
  finalMd += `_Fecha: ${new Date().toISOString().slice(0, 10)}_\n\n---\n`;

  for (const res of exitosas) {
    const { url, folder } = res;
    finalMd += `\n\n## 🔍 Página: ${url}\n\n`;

    const reportPath = path.join(folder, 'report.json');
    const textPath = path.join(folder, 'texto-visible.txt');

    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const audits = report.audits;
      const seoScore = report.categories.seo.score;
      finalMd += `**Puntaje SEO (Lighthouse):** ${Math.round(seoScore * 100)} / 100\n\n`;

      finalMd += `### Problemas detectados:\n`;
      const issues = Object.values(audits).filter(a => a.score !== 1 && a.scoreDisplayMode !== 'notApplicable');
      for (const item of issues) {
        finalMd += `- ${item.title} (${item.score !== null ? Math.round(item.score * 100) : 'N/A'})\n`;
      }
    }

    if (fs.existsSync(textPath)) {
      const texto = fs.readFileSync(textPath, 'utf-8');
      const palabras = texto.split(/\s+/).filter(w => w.length > 3);
      const topWords = {};
      palabras.forEach(p => {
        topWords[p] = (topWords[p] || 0) + 1;
      });
      const top = Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 10);
      finalMd += `\n**Top palabras visibles:** ${top.map(w => w[0]).join(', ')}\n`;
    }

    finalMd += `\n---\n`;
  }

  if (fallidas.length > 0) {
    finalMd += `\n\n## ⚠️ URLs que fallaron (404 o error de carga)\n\n`;
    fallidas.forEach(f => finalMd += `- ${f}\n`);
  }

  const mdPath = path.join(folderName, 'informe-seo-final.md');
  const pdfPath = path.join(folderName, 'informe-seo-final.pdf');
  fs.writeFileSync(mdPath, finalMd);
  await generatePdfFromMd(mdPath, pdfPath);
  fs.unlinkSync(mdPath);

  console.log(`\n✅ Informe generado: ${pdfPath}`);
})();