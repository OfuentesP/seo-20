const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express(); // <-- esta línea es clave

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.post('/analizar', (req, res) => {
    const { url } = req.body;
  
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'URL inválida' });
    }
  
    const fecha = new Date().toISOString().split('T')[0];
    const comando = `echo "${url}" | node seo20-completo.js`;
  
    exec(comando, { timeout: 180000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error al ejecutar análisis:', error);
        return res.status(500).json({ error: 'Error en el análisis SEO.' });
      }
  
      // Ruta del PDF generado por tu script (ajústala si cambia)
      const nombreArchivo = `informe-seo.pdf`; // o generado dinámicamente
      const rutaArchivo = path.join(__dirname, 'resultados', nombreArchivo);
  
      // Verifica si el archivo existe
      fs.access(rutaArchivo, fs.constants.F_OK, (err) => {
        if (err) {
          console.error('No se encontró el archivo:', rutaArchivo);
          return res.status(500).json({ error: 'No se pudo generar el informe.' });
        }
  
        // Enviar el archivo como descarga
        res.download(rutaArchivo, nombreArchivo);
      });
    });
  });
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
  