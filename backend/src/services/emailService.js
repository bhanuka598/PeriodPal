const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Send OTP email for verification
 * @param {string} to - Recipient email address
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP (registration, password_reset, etc.)
 */
const sendOTPEmail = async (to, otp, purpose = 'registration') => {
  const subject = purpose === 'registration' 
    ? 'Verify Your Email - PeriodPal' 
    : 'OTP Verification - PeriodPal';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9f5f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #e85d4c 0%, #f4a261 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #2d3748;
          margin-top: 0;
          font-size: 22px;
        }
        .otp-box {
          background-color: #fef3f2;
          border: 2px dashed #e85d4c;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 42px;
          font-weight: 700;
          color: #e85d4c;
          letter-spacing: 8px;
          margin: 0;
        }
        .message {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .footer {
          background-color: #f7fafc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #718096;
          font-size: 14px;
          margin: 0;
        }
        .warning {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          margin-top: 20px;
          border-radius: 4px;
          color: #92400e;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 PeriodPal</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email</h2>
          <p class="message">
            Thank you for joining PeriodPal! To complete your registration, please use the verification code below:
          </p>
          
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          
          <div class="warning">
            ⏰ This code will expire in <strong>10 minutes</strong>.
          </div>
          
          <p class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
            If you didn't request this verification, please ignore this email or contact our support team.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PeriodPal. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            Menstrual Health for Every Community
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: {
      name: 'PeriodPal',
      address: process.env.EMAIL_USER
    },
    to,
    subject,
    html: htmlContent,
    text: `Your PeriodPal verification code is: ${otp}. This code will expire in 10 minutes.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

module.exports = { sendOTPEmail };
