const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {

    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"PeriodPal 💜" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
};

module.exports = sendEmail;