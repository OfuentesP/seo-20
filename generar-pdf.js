const fs = require('fs');
const markdownpdf = require('markdown-pdf');

async function generarPDF(markdownString, outputPath) {
  return new Promise((resolve, reject) => {
    const tempPath = outputPath.replace(/\.pdf$/, '.md');
    fs.writeFileSync(tempPath, markdownString);

    markdownpdf()
      .from(tempPath)
      .to(outputPath, function () {
        console.log('📄 PDF generado correctamente.');
        fs.unlinkSync(tempPath); // elimina el archivo temporal
        resolve();
      });
  });
}

module.exports = {
  generarPDF
};
