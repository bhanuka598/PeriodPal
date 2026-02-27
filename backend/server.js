require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");

connectDB();

const app = express();

app.use(cors());
app.use(morgan("dev"));

/**
 * ✅ Stripe webhook MUST be raw body
 * Put this BEFORE express.json()
 */
app.use("/api/orders/webhook/stripe", express.raw({ type: "application/json" }));

/**
 * ✅ Normal JSON middleware for all other routes
 */
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PeriodPal API is running...");
});

app.get("/test-email", async (req, res) => {
  try {
    const sendEmail = require("./src/utils/sendEmail");
    await sendEmail("yourrealemail@gmail.com", "Test Email", "<h1>Hello PeriodPal</h1>");
    res.json({ success: true, message: "Email sent" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use("/api/products", require("./src/routes/productRoutes"));
app.use("/api/cart", require("./src/routes/cartRoutes"));
app.use("/api/orders", require("./src/routes/orderRoutes"));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  console.error(`[${statusCode}]`, message);

  res.status(statusCode).json({
    success: false,
    message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));