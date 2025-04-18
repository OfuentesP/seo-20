
const axios = require('axios');
const fs = require('fs');

module.exports = async function analizarResumenSitemap(urls) {
  let total = urls.length;
  let conTest = 0;
  let conPrueba = 0;
  let conError404 = 0;

  for (let url of urls) {
    if (/test/i.test(url)) conTest++;
    if (/prueba/i.test(url)) conPrueba++;

    try {
      const response = await axios.head(url, { timeout: 8000 });
      if (response.status === 404) conError404++;
    } catch (err) {
      conError404++;
    }
  }

  return {
    total,
    conTest,
    conPrueba,
    conError404
  };
};
