document.getElementById('form-analisis').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const url = document.getElementById('url').value;
    const estado = document.getElementById('estado');
    const barra = document.getElementById('barra-progreso');
  
    estado.innerText = '🔍 Iniciando análisis SEO...';
    barra.style.width = '10%';
  
    try {
      const res = await fetch('/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
  
      if (!res.ok) {
        throw new Error('Error al ejecutar análisis.');
      }
  
      estado.innerText = '📥 Generando informe...';
      barra.style.width = '60%';
  
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = 'informe-seo.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      estado.innerText = '✅ Análisis completo. Informe descargado.';
      barra.style.width = '100%';
    } catch (err) {
      estado.innerText = '❌ Error al ejecutar análisis.';
      barra.style.width = '0%';
    }
  });
  