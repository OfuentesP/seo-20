const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/analizar', (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const fecha = new Date().toISOString().split('T')[0];
  const comando = `node seo20-completo.js "${url}"`;

  exec(comando, { timeout: 180000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error al ejecutar análisis:', error);
      return res.status(500).json({ error: 'Error en el análisis SEO.' });
    }

    const rutaPDF = path.join(__dirname, 'resultados', 'informe-seo.pdf');

    fs.access(rutaPDF, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('No se encontró el informe:', rutaPDF);
        return res.status(404).json({ error: 'Informe no disponible.' });
      }

      res.download(rutaPDF, 'informe-seo.pdf');
    });
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});
