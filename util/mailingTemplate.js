const baseTemplate = ({ title, body }) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="max-width:600px; margin:0 auto; background:white; border-radius:10px; overflow:hidden;">
      <!-- Header -->
      <tr>
        <td style="background:#6a0dad; padding:20px; text-align:center; color:white;">
          <img src="https://res.cloudinary.com/datkmmesm/image/upload/v1757886552/zacraclearning_qknjdh.png" alt="Zacrac Learning" 
               style="width:120px; margin-bottom:10px;">
          <h1 style="margin:0; font-size:22px;">Zacrac Learning</h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:20px; color:#333;">
          <h2 style="color:#6a0dad; margin-top:0;">${title}</h2>
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#000; padding:15px; text-align:center; color:white; font-size:12px;">
          <p style="margin:0;">Need help? <a href="mailto:support@zacrac.com" style="color:#ff9800;">Contact Support</a></p>
          <p style="margin:5px 0 0;">© ${new Date().getFullYear()} Zacrac Learning. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}
const otpTemplate = (otp) => {
    const body = `
        <p style="line-height:1.6;">Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing:5px; color:#ff9800; text-align:center; margin:20px 0;">${otp}</h1>
        <p style="color:#666; line-height:1.6;">This code will expire in <b>10 minutes</b>.</p>
    `;
    return {
        subject: "🔐 Verify Your Account - OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        html: baseTemplate({ title: "Account Verification", body }),
    };
};

const resetPasswordTemplate = (resetLink) => {
    const body = `
        <p>You requested a password reset. Click below to continue:</p>
        <div style="text-align:center; margin:20px 0;">
        <a href="${resetLink}" style="background:#6a0dad; color:white; padding:12px 25px; text-decoration:none; border-radius:5px;">
            Reset Password
        </a>
        </div>
        <p style="color:#666;">If you didn’t request this, you can ignore this email.</p>
    `;
    return {
        subject: "🔑 Reset Your Password",
        text: `Reset your password here: ${resetLink}`,
        html: baseTemplate({ title: "Reset Password Request", body }),
    };
}

module.exports = {
    otpTemplate,
    resetPasswordTemplate,
}