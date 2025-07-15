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

const sendMail = async(to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to: to,
            subject: subject,
            text: text
        })
        console.log("Email sent successfully");

    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
}
module.exports ={
    generateOtp,
    sendMail
}