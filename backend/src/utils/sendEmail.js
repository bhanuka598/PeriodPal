const dns = require("dns");
const nodemailer = require("nodemailer");
const { smtpLookupIPv4 } = require("./smtpLookup");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  lookup: smtpLookupIPv4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  connectionTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"PeriodPal 💜" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return null;
  }
}

module.exports = sendEmail;
