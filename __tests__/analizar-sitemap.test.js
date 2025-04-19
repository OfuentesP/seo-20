const { analizarSitemap } = require('../analizar-sitemap');
const axios = require('axios');

jest.mock('axios');

describe('analizarSitemap', () => {
  it('should process a valid sitemap', async () => {
    const correctSitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://www.example.com/</loc>
        </url>
        <url>
          <loc>https://www.example.com/page1</loc>
        </url>
        <url>
          <loc>https://www.example.com/test</loc>
        </url>
      </urlset>
    `;
    axios.get.mockResolvedValue({ data: correctSitemap });

    const result = await analizarSitemap('https://www.example.com');
    expect(result).toContain(`# 🗺️ Análisis de Sitemap para https://www.example.com/sitemap.xml
✅ El sitemap está accesible y retornó código 200
📦 Contiene **3** URLs
🕒 Última fecha de modificación encontrada: **No disponible**
🔍 Etiquetas detectadas: - lastmod: ❌ No - changefreq: ❌ No - priority: ❌ No
### 🧩 Secciones más representadas:
- home: 1 URLs
- page1: 1 URLs
- test: 1 URLs
⚠️ **Advertencia:** Se detectaron **1** URLs que parecen ser de test o entorno de desarrollo:
- https://www.example.com/test
### 📌 Recomendaciones SEO para el sitemap:
- ✅ Usa <lastmod> para mejorar el rastreo eficiente de Google
- ❗ Considera incluir <changefreq> para indicar frecuencia de actualización
- ❗ Evalúa usar <priority> para destacar páginas clave
- 🔍 Elimina URLs con términos como “test”, “prueba”, “dev” si no deberían estar indexadas
- 🔥 Evita páginas con noindex, redirecciones o errores 4xx/5xx en tu sitemap
- 📦 Divide el sitemap si supera las 50.000 URLs o 50MB y usa un índice
- 🎯 Añade sitemaps específicos para imágenes o videos si aplica al contenido del sitio`);
  });
  it('should handle an incorrect sitemap', async () => {
    axios.get.mockResolvedValue({ data: 'incorrect sitemap' });
    const result = await analizarSitemap('https://www.example.com');
    expect(result).toContain('❌ Error al procesar la respuesta del sitemap.');
  });
  it('should handle an empty sitemap', async () => {

    const emptySitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      </urlset>
    `;
    axios.get.mockResolvedValue({ data: emptySitemap });

    const result = await analizarSitemap('https://www.example.com');
    expect(result).toContain(`# 🗺️ Análisis de Sitemap para https://www.example.com/sitemap.xml
✅ El sitemap está accesible y retornó código 200
📦 Contiene **0** URLs
🕒 Última fecha de modificación encontrada: **No disponible**
🔍 Etiquetas detectadas: - lastmod: ❌ No - changefreq: ❌ No - priority: ❌ No
### 🧩 Secciones más representadas:
### 📌 Recomendaciones SEO para el sitemap
- ✅ Usa <lastmod> para mejorar el rastreo eficiente de Google
- ❗ Considera incluir <changefreq> para indicar frecuencia de actualización
- ❗ Evalúa usar <priority> para destacar páginas clave
- 🔍 Elimina URLs con términos como “test”, “prueba”, “dev” si no deberían estar indexadas
- 🔥 Evita páginas con noindex, redirecciones o errores 4xx/5xx en tu sitemap
- 📦 Divide el sitemap si supera las 50.000 URLs o 50MB y usa un índice
- 🎯 Añade sitemaps específicos para imágenes o videos si aplica al contenido del sitio`);
  });
});