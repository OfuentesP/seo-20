const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para ejecutar análisis SEO
app.post('/analizar', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const dominio = new URL(url).hostname.replace('www.', '');
  const fecha = new Date().toISOString().slice(0, 10);
  const carpeta = `${fecha}_${dominio}`;
  const pdfPath = `/resultados/${carpeta}/informe-seo-estilizado.pdf`;

  console.log(`🚀 Ejecutando análisis SEO para: ${url}`);

  const comando = spawn('node', ['seo20-completo.js', url], { cwd: __dirname });

  comando.stdout.on('data', data => console.log(data.toString()));
  comando.stderr.on('data', data => console.error(data.toString()));

  comando.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Proceso SEO finalizó con error. Código: ${code}`);
      return res.status(500).json({ error: 'El análisis SEO falló (código ' + code + ')' });
    }

    const rutaPDF = path.join(__dirname, pdfPath);
    if (fs.existsSync(rutaPDF)) {
      res.json({ success: true, url: pdfPath });
    } else {
      res.status(500).json({ error: 'PDF no generado correctamente' });
    }
  });
});

// Endpoint para servir el PDF generado
app.get('/resultados/:carpeta/informe-seo-estilizado.pdf', (req, res) => {
  const { carpeta } = req.params;
  const pdfPath = path.join(__dirname, 'resultados', carpeta, 'informe-seo-estilizado.pdf');

  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).send('Informe no encontrado.');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});
