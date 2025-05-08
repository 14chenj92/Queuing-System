const fs = require('fs');
const path = require('path');
const os = require('os');
const signer = require('node-signpdf').default;
const { PDFDocument } = require('pdf-lib');
const plainAddPlaceholder = require('node-signpdf/dist/helpers/plainAddPlaceholder'); // <- NOTE

async function generateSignedWaiver({ firstName, lastName, date }) {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const waiverFormsPath = path.join(desktopPath, 'WaiverForms');
  if (!fs.existsSync(waiverFormsPath)) {
    fs.mkdirSync(waiverFormsPath, { recursive: true });
  }

  const outputPath = path.join(waiverFormsPath, `${firstName}_${lastName}_Waiver.pdf`);
  const unsignedPdfPath = path.join(__dirname, 'waivers', `${firstName}_${lastName}_unsigned.pdf`);

  // Create basic PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  page.drawText(`Waiver for ${firstName} ${lastName}`, { x: 50, y: height - 100 });
  page.drawText(`Date: ${date}`, { x: 50, y: height - 120 });
  fs.writeFileSync(unsignedPdfPath, await pdfDoc.save());

  // Add placeholder
  const pdfBufferWithPlaceholder = plainAddPlaceholder({
    pdfBuffer: fs.readFileSync(unsignedPdfPath),
    reason: 'Signed electronically by 21BC',
    signatureLength: 8192,
  });

  // Sign the PDF
  const p12Buffer = fs.readFileSync(path.join(__dirname, 'keys', 'private.p12'));
  const signedPdf = signer.sign(pdfBufferWithPlaceholder, {
    p12Buffer,
    passphrase: 'your-passphrase', // Replace this
  });

  fs.writeFileSync(outputPath, signedPdf);
  return outputPath;
}

module.exports = generateSignedWaiver;
