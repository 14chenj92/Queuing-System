const fs = require('fs');
const path = require('path');
const os = require('os');
const signer = require('node-signpdf').default;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { plainAddPlaceholder } = require('node-signpdf/dist/helpers');

async function generateSignedWaiver({ firstName, lastName, date }) {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const waiverFormsPath = path.join(desktopPath, 'WaiverForms');
  if (!fs.existsSync(waiverFormsPath)) {
    fs.mkdirSync(waiverFormsPath, { recursive: true });
  }

  const formattedDate = new Date(date).toISOString().split('T')[0];
  const timestamp = new Date()
    .toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/[/:]/g, '-')
    .replace(', ', '_');

  const outputFilename = `${firstName}_${lastName}_Waiver_${timestamp}.pdf`;
  const outputPath = path.join(waiverFormsPath, outputFilename);
  const waiverTemplatePath = path.join(__dirname, '21BC_Waiver_CleanFillable.pdf');

  const existingPdfBytes = fs.readFileSync(waiverTemplatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  firstPage.drawText(`${firstName} ${lastName}`, {
    x: 140,
    y: height - 230,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`${formattedDate}`, {
    x: 400,
    y: 112,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`${firstName} ${lastName}`, {
    x: 133,
    y: 138,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`${formattedDate}`, {
    x: 270,
    y: 138,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  const pdfBufferWithPlaceholder = plainAddPlaceholder({
    pdfBuffer: Buffer.from(pdfBytes),
    reason: 'Signed electronically by 21BC',
    signatureLength: 8192,
  });

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
