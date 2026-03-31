const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
  if (!ok) {
    cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed (max 5MB)."));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

function handleUploadSingle(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    // Multer / Express can leave req.body undefined for some multipart edge cases
    if (req.body == null || typeof req.body !== "object") {
      req.body = {};
    }
    next();
  });
}

/**
 * Only run multer for multipart/form-data. For application/json, express.json()
 * already set req.body — running multer can leave req.body undefined on some stacks.
 */
function multipartProductParser(req, res, next) {
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("multipart/form-data")) {
    return handleUploadSingle(req, res, next);
  }
  if (req.body == null || typeof req.body !== "object") {
    req.body = {};
  }
  next();
}

module.exports = { upload, handleUploadSingle, multipartProductParser };
