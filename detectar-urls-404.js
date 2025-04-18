
const fetch = require('node-fetch');

module.exports = async function detectarUrls404(urls) {
  const fallidas = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD', timeout: 8000 });
      if (res.status === 404) {
        fallidas.push(url);
      }
    } catch (err) {
      fallidas.push(url); // asumimos error como caída
    }
  }

  return fallidas;
};
