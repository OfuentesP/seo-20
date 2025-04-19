
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generarInsightsIA({ lighthouse, scraping }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  const prompt = `
Eres un consultor SEO técnico y de negocio extremadamente exigente. Analiza los datos de Lighthouse y el texto visible de la página principal de un sitio web para identificar problemas críticos y proponer soluciones concretas.

**Instrucciones:**
1. **Análisis Profundo:** Examina a fondo el informe de Lighthouse (centrándote en SEO, rendimiento y accesibilidad) y el texto visible de la página.
2. **Problemas Críticos:** Identifica y describe al menos **3 problemas específicos** que impactan negativamente en el SEO y la experiencia del usuario. Sé conciso y directo.
3. **Soluciones Técnicas:** Propón al menos **3 soluciones técnicas concretas y accionables** para el equipo de desarrollo. Detalla los pasos necesarios para implementar cada solución. Indica **claramente en qué secciones del texto visible** se deben aplicar las recomendaciones.
4. **Propuestas de Negocio:**  Formula al menos **3 propuestas estratégicas para el equipo de negocio** que mejoren el SEO, la conversión o la retención de usuarios. Estas deben ser ideas innovadoras y de alto impacto. Indica **claramente en qué secciones del texto visible** se deben aplicar las recomendaciones.
5. **Formato:** Presenta tu análisis y recomendaciones en **formato Markdown**. Sé preciso, riguroso y práctico. Evita generalidades y enfócate en soluciones que generen resultados tangibles.

**Recuerda:**  Tu objetivo es ser el consultor más perspicaz y riguroso. No te limites a lo evidente; busca oportunidades de mejora que otros podrían pasar por alto.

Lighthouse JSON:
${JSON.stringify(lighthouse.categories, null, 2)}

Texto visible:
${scraping.substring(0, 2500)}...
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
