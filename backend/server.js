const config = require("./src/config/config");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const passport = require("./src/config/passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'x-demo-login-email'],
  credentials: true
}));
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
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Donor dashboard — extra aliases (primary handler: GET /api/orders/donor-summary on orderRoutes)
const { protect } = require("./src/middleware/authMiddleware");
const orderController = require("./src/controllers/orderController");
app.get("/api/me/donations", protect, orderController.getMyDonationData);
app.get("/api/users/me/donations", protect, orderController.getMyDonationData);

app.get("/", (req, res) => {
  res.send("PeriodPal API is running...");
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api/inventory", require("./src/routes/inventoryRoutes"));
app.use("/api/records", require("./src/routes/menstrualRecordRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/auth", require("./src/routes/authRoutes"));

// JSON 404 for API (avoids HTML so the SPA shows a clear message, not a raw error page)
app.use((req, res) => {
  const pathOnly = (req.originalUrl || "").split("?")[0];
  if (pathOnly.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: `Not found: ${req.method} ${pathOnly}`,
      hint: "Donor summary: GET /api/orders/donor-summary (or /api/me/donations) with Authorization: Bearer <JWT>",
    });
  }
  res.status(404).type("text").send("Not found");
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  console.error(`[${statusCode}]`, message);

  res.status(statusCode).json({
    success: false,
    message,
  });
});

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

module.exports = app;