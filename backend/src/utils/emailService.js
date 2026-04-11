const nodemailer = require("nodemailer");

const sendLowStockEmail = async ({ to, productType, totalStock, centerLocation }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER / EMAIL_PASS not set in .env");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const limit = Number(process.env.LOW_STOCK_LIMIT || 20);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `⚠ Low Stock Alert: ${productType}`,
    text:
      `Low stock detected!\n\n` +
      `Product: ${productType}\n` +
      `Remaining: ${totalStock}\n` +
      `Center: ${centerLocation}\n` +
      `Threshold: ${limit}\n\n` +
      `Please restock soon.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendLowStockEmail };