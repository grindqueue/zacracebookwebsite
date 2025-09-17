const nodeMailer = require('nodemailer');
const otpGenerator = require('otp-generator');
require('dotenv').config();

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASS
    }
})
const generateOtp = () => {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });
};

const sendMail = async (to, subject, text, html, attachments) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_ACCOUNT,
            to,
            subject,
            text,        // fallback (optional)
            html,        // HTML template (optional)
            attachments, // optional
        });
        console.log(`Email sent to: ${to}, Subject: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
};

module.exports ={
    generateOtp,
    sendMail
}