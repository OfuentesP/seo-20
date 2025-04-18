const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Lista simple de stopwords en español
const stopwords = new Set([
  "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una",
  "su", "al", "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este", "sí", "porque", "esta", "entre",
  "cuando", "muy", "sin", "sobre", "también", "me", "hasta", "hay", "donde", "quien", "desde", "todo", "nos"
]);

// Función principal
module.exports = async function(textFilePath, outputPath) {
  const rawText = fs.readFileSync(textFilePath, 'utf-8');
  const cleanText = rawText.toLowerCase().replace(/[^a-záéíóúñ\s]/gi, '');
  const words = cleanText.split(/\s+/);
  const filtered = words.filter(w => w.length > 3 && !stopwords.has(w));
  
  const freq = {};
  filtered.forEach(word => freq[word] = (freq[word] || 0) + 1);
  const topKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(entry => entry[0]);

  let output = `# 🔍 Análisis de Competencia por Keywords SEO\n\n`;
  output += `Palabras clave extraídas automáticamente desde el texto visible:\n\n`;
  topKeywords.forEach(k => output += `- **${k}**\n`);
  output += `\n---\n`;

  for (const keyword of topKeywords) {
    const query = encodeURIComponent(keyword);
    const url = `https://www.google.com/search?q=${query}&hl=es`;
    output += `## Keyword: "${keyword}"\n\n`;

    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(res.data);
      const results = [];

      $('div.tF2Cxc').each((i, el) => {
        const title = $(el).find('h3').text();
        const link = $(el).find('a').attr('href');
        const snippet = $(el).find('.VwiC3b, .IsZvec').text();
        if (title && link) {
          results.push({ pos: i + 1, title, link, snippet });
        }
      });

      if (results.length === 0) {
        output += `⚠️ No se encontraron resultados visibles. Google podría estar limitando el scraping.\n\n---\n`;
      } else {
        results.slice(0, 10).forEach(r => {
          output += `### #${r.pos} – ${r.title}\n`;
          output += `${r.link}\n\n`;
          if (r.snippet) output += `> ${r.snippet}\n`;
          output += `\n`;
        });
        output += `---\n`;
      }

    } catch (err) {
      output += `❌ Error al analizar "${keyword}": ${err.message}\n\n---\n`;
    }
  }

  fs.writeFileSync(outputPath, output);
  console.log(`📈 Informe de competencia generado: ${outputPath}`);
};
