# 🚀 seo20 – Auditoría SEO Visual + Técnica con IA (versión avanzada)

**seo20** es una herramienta de línea de comandos que automatiza el análisis SEO de un sitio web, generando informes profesionales en PDF basados en:

- Lighthouse (SEO técnico)
- Scraping de contenido visible (texto HTML real)
- Captura de pantalla visual del sitio
- Análisis de competencia en Google para las principales palabras clave extraídas automáticamente

---

## 📦 Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tuusuario/seo20.git
cd seo20
```

2. Instala las dependencias:
```bash
npm install
```

3. (Opcional) Enlázalo como comando global:
```bash
npm link
```

---

## 🚀 Uso

```bash
node seo20.js
```

Te pedirá una URL y generará:

- `texto-visible.txt`
- `screenshot.png`
- `report.json`
- `recomendaciones.md / .pdf`
- `reporte-tecnico.md / .pdf`
- `competencia-keywords.md`

Todo en una carpeta `resultados/YYYY-MM-DD-dominio`.

---

## 📄 Informes generados

- **Recomendaciones SEO** por zonas visuales (hero, categorías, etc.)
- **Informe técnico SEO** con problemas explicados para personas técnicas y no técnicas
- **Análisis de competencia por keywords** (top 10 Google de las keywords más usadas)

---

## 🔧 Dependencias clave

- `puppeteer` – para screenshots y generación de PDF profesional
- `markdown-it` – para convertir Markdown a HTML
- `axios + cheerio` – para scraping de HTML
- `prompt-sync` – para entrada interactiva en consola

---

## 📁 Estructura recomendada

```
seo20/
├── seo20.js
├── scrape-text.js
├── screenshot.js
├── keyword-competencia.js
├── utils/
│   └── pdf-generator.js
├── resultados/
├── resultados-previos/
├── README.md
├── .gitignore
├── package.json
```

---

## 🧼 Mantenimiento

Para limpiar dependencias innecesarias o corruptas:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📄 Licencia

MIT – uso libre incluso para fines comerciales.