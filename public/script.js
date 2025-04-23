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

    const data = await res.json();

    if (data.success) {
      estado.innerText = '✅ Informe generado. Abriendo informe...';
      barra.style.width = '100%';
      window.open(data.url, '_blank'); // Abre el PDF en otra pestaña
    } else {
      throw new Error('El informe no fue generado correctamente.');
    }

  } catch (err) {
    console.error('❌ Error:', err);
    estado.innerText = '❌ Error al ejecutar análisis.';
    barra.style.width = '0%';
  }
});
