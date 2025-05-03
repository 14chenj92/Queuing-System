const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateWaiverPDF({ firstName, lastName, date, code }) {
    const doc = new PDFDocument();
    const fileName = `${firstName}_${lastName}_Waiver.pdf`;
    const filePath = path.join(__dirname, 'waivers', fileName);

    // Ensure the waivers folder exists
    if (!fs.existsSync(path.join(__dirname, 'waivers'))) {
        fs.mkdirSync(path.join(__dirname, 'waivers'));
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(12).text(`GYM WAIVER AND RELEASE AGREEMENT`, { align: 'center' });
    doc.moveDown();

    doc.text(`Facility: 21 Badminton Club (21BC)
Location: 40760 Encyclopedia Cir, Fremont, CA 94538

I, the undersigned, wish to use the facilities and participate in activities provided by 21 Badminton Club (21BC). By signing this waiver, I acknowledge and agree to the following terms:

Participant Information:
• Full Name: ${firstName} ${lastName}
• Date of Birth: ____________________
• Address: ________________________________________
• Phone Number: _____________________________
• Emergency Contact: ____________________

Assumption of Risk:
I acknowledge that using 21BC facilities, equipment, and participating in physical exercise involves inherent risks...

Waiver and Release:
I hereby release, waive, discharge, and agree not to sue 21BC, its employees, or agents...

Acknowledgment:
I have read this waiver and understand its terms.

Signature: ____________________        Date: ${date}
Parent/Guardian Signature (if under 18): ____________________        Date: ____________________`);

    doc.end();

    return filePath; 
}

module.exports = generateWaiverPDF;
