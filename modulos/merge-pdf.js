const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs(pdfPaths, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfPath of pdfPaths) {
    if (fs.existsSync(pdfPath)) {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } else {
      console.warn(`⚠️ No se encontró: ${pdfPath}`);
    }
  }

  const finalPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, finalPdfBytes);
  console.log(`📄 PDF final generado en: ${outputPath}`);
}

module.exports = mergePDFs;
