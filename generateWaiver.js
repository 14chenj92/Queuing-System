const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const signer = require('node-signpdf').default;
const { PDFDocument, rgb, StandardFonts, PDFName } = require('pdf-lib');
const { plainAddPlaceholder } = require('node-signpdf/dist/helpers');

function generateP12({ firstName, lastName, email }) {
  const name = `${firstName} ${lastName}`;
  const subj = `/CN=${name}/emailAddress=${email}`;
  const keyPath = path.join(__dirname, 'temp.key');
  const crtPath = path.join(__dirname, 'temp.crt');
  const p12Path = path.join(__dirname, 'temp.p12');

  execSync(`openssl req -newkey rsa:2048 -nodes -keyout "${keyPath}" -x509 -days 7300 -out "${crtPath}" -subj "${subj}"`, { stdio: 'ignore' });
  execSync(`openssl pkcs12 -export -out "${p12Path}" -inkey "${keyPath}" -in "${crtPath}" -passout pass:root`, { stdio: 'ignore' });

  const p12Buffer = fs.readFileSync(p12Path);
  fs.unlinkSync(keyPath);
  fs.unlinkSync(crtPath);
  fs.unlinkSync(p12Path);

  return p12Buffer;
}

async function generateSignedWaiver({ firstName, lastName, email, date }) {
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

  const acroForm = pdfDoc.catalog.lookup(PDFName.of('AcroForm'));
  if (acroForm) {
    pdfDoc.catalog.set(PDFName.of('AcroForm'), undefined);
  }

  for (const page of pdfDoc.getPages()) {
    const annotations = page.node.Annots();
    if (annotations) {
      page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([]));
    }
  }

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

  firstPage.drawText(`${formattedDate}`, {
    x: 270,
    y: 138,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText('Digitally signed', {
  x: 135, 
  y: 138, 
  size: 10,
  font,
  color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  const pdfBufferWithPlaceholder = plainAddPlaceholder({
    pdfBuffer: Buffer.from(pdfBytes),
    reason: 'Signed electronically by 21BC',
    signatureLength: 8192,
    signatureFieldName: 'Signature1',
    rect: [133, 132, 300, 150],
    page: 0,
  });

  try {
    const p12Buffer = generateP12({ firstName, lastName, email });

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
