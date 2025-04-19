const axios = require('axios');

async function detect404(url) {
  try {
    const response = await axios.head(url);
    return response.status === 404;
  } catch (err) {
    console.log(`❌ Error checking 404 for url: ${url}. Error: ${err.message}`);
    return true;
  }
}

module.exports = { detect404 };