
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generarInsightsIA({ lighthouse, scraping }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  const prompt = `
Eres un experto en SEO técnico y UX. A partir del resultado de Lighthouse y el texto visible del Home de un sitio web,
genera recomendaciones estratégicas de mejora en SEO, accesibilidad o contenido.

Entrega:
- 3 problemas detectados breves
- 3 recomendaciones para el equipo técnico
- 3 recomendaciones orientadas al negocio
- Redáctalo en markdown y sé concreto.

Lighthouse JSON:
${JSON.stringify(lighthouse.categories, null, 2)}

Texto visible:
${scraping.substring(0, 1500)}...
`;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return text;
  } catch (err) {
    console.error('⚠️ Error al generar recomendaciones con Gemini:', err.message);
    return 'No se pudieron generar recomendaciones automáticas con IA.';
  }
};
