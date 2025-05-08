const fs = require('fs');
const path = require('path');
const os = require('os');
const signer = require('node-signpdf').default;
const { PDFDocument, rgb } = require('pdf-lib');
const { plainAddPlaceholder } = require('node-signpdf/dist/helpers');

async function generateSignedWaiver({ firstName, lastName, date }) {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const waiverFormsPath = path.join(desktopPath, 'WaiverForms');
  if (!fs.existsSync(waiverFormsPath)) {
    fs.mkdirSync(waiverFormsPath, { recursive: true });
  }

  const outputPath = path.join(waiverFormsPath, `${firstName}_${lastName}_Waiver.pdf`);
  const unsignedPdfPath = path.join(__dirname, 'waivers', `${firstName}_${lastName}_unsigned.pdf`);

  // STEP 1: Generate and fill PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { height } = page.getSize();

  page.drawText(`Waiver for ${firstName} ${lastName}`, {
    x: 50,
    y: height - 100,
    size: 16,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Date: ${date}`, {
    x: 50,
    y: height - 130,
    size: 12,
  });

  page.drawText('Signature:', {
    x: 50,
    y: 100,
    size: 12,
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(unsignedPdfPath, pdfBytes);

  // STEP 2: Add signature placeholder
  const pdfBufferWithPlaceholder = plainAddPlaceholder({
    pdfBuffer: fs.readFileSync(unsignedPdfPath),
    reason: 'Signed electronically by 21BC',
    signatureLength: 8192,
  });

  // STEP 3: Sign the PDF
  try {
    const p12Path = path.join(__dirname, 'fixed-private.p12');
    const p12Buffer = fs.readFileSync(p12Path);

    const signedPdf = signer.sign(pdfBufferWithPlaceholder, p12Buffer, {
      passphrase: 'root',
    });

    fs.writeFileSync(outputPath, signedPdf);
    return outputPath;
  } catch (err) {
    console.error('Error signing PDF with .p12:', err);
  }
}

module.exports = generateSignedWaiver;
