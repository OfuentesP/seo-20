const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

module.exports = async function scrape(url, outputPath) {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    fs.writeFileSync(outputPath, text);
  } catch (err) {
    throw new Error('❌ Error en el scrapping: ' + err.message);
  }
};