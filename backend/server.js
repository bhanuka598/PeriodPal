import config from './src/config/config.js';
import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import passport from "./src/config/passport.js";
import session from "express-session";
import cookieParser from "cookie-parser";

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});