async function scrape(url) {
  try {
    console.log(`scrape ${url}`);
  } catch (err) {
    console.log(`❌ Error scraping url: ${url}. Error: ${err.message}`);
  }
}

module.exports = { scrape };