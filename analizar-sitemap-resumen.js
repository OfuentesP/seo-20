const axios = require('axios');

module.exports = async function analizarResumenSitemap(urls) {
  try {
    const totalUrls = urls.length;
    let conTest = 0;
    let conPrueba = 0;
    let conError404 = 0;
    let processedUrls = 0;

    // Function to process a single URL
    const processUrl = async (url) => {
      if (/test/i.test(url)) conTest++;
      if (/prueba/i.test(url)) conPrueba++;

      try {
        try {
          const response = await axios.head(url, { timeout: 60000 }); // Increased timeout to 60 seconds
          if (response.status === 404) conError404++;
        } catch (err) {
          // console.error(`❌ Error al procesar la URL: ${url}. Error: ${err.message}`);
        } 
      } catch (err) {
        console.error(`❌ Error en la solicitud de la URL: ${url}. Error: ${err.message}`);
      }

      processedUrls++;
      const percentage = ((processedUrls / totalUrls) * 100).toFixed(2);
      console.log(`Processed URL: ${url} (${percentage}%)`);
    };

    // Process all URLs concurrently using Promise.all()
    const urlPromises = urls.map(processUrl);
    await Promise.all(urlPromises);

    return {
      total: totalUrls,
      conTest,
      conPrueba,
      conError404,
    };
  } catch (err) {
    console.error(`❌ Error inesperado en analizarResumenSitemap: ${err.message}`);
  }
};