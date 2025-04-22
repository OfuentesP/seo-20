const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para correr análisis SEO
app.post('/analizar', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const dominio = new URL(url).hostname.replace('www.', '');
  const fecha = new Date().toISOString().slice(0, 10);
  const carpeta = `${fecha}_${dominio}`;
  const command = `node seo20-completo.js ${url}`;

  exec(command, { cwd: __dirname, timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error ejecutando análisis:`, error.message);
      return res.status(500).json({ error: 'Error ejecutando análisis SEO' });
    }

    const pdfPath = `/resultados/${carpeta}/informe-seo-final.pdf`;
    if (fs.existsSync(path.join(__dirname, pdfPath))) {
      res.json({ success: true, url: pdfPath });
    } else {
      res.status(500).json({ error: 'PDF no generado' });
    }
  });
});

// Endpoint para descargar PDF
app.get('/resultados/:carpeta/informe-seo-final.pdf', (req, res) => {
  const { carpeta } = req.params;
  const pdfPath = path.join(__dirname, 'resultados', carpeta, 'informe-seo-final.pdf');

  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).send('Informe no encontrado.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
