require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generarInsightsIA({ lighthouse, scraping }) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
Eres un experto en SEO y experiencia de usuario. Recibirás un resumen técnico del rendimiento SEO de un sitio, junto con el texto visible del home. Tu tarea es detectar problemas y generar recomendaciones prácticas tanto para el equipo técnico como para el negocio.

1. Resume los problemas clave detectados.
2. Entrega 3 recomendaciones técnicas y 3 de negocio.
3. Usa un tono profesional y directo.
4. Formatea la respuesta con títulos, listas y claridad para ser incluida en un informe.

### JSON Lighthouse
${JSON.stringify(lighthouse, null, 2)}

### Texto visible del Home
${scraping}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.warn('❌ Error al generar recomendaciones IA:', err.message || err);
    return 'No se pudieron generar recomendaciones automáticas con IA.';
  }
};
