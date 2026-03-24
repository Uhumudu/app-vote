// backend/routes/upload.routes.js
import express from "express";
import multer  from "multer";
import path    from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `photo-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."));
  }
});

const router = express.Router();

// POST /api/uploads/photo — sans verifyToken (pas de donnée sensible)
router.post("/uploads/photo", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

export default router;































// // backend/routes/upload.routes.js
// import express from "express";
// import multer  from "multer";
// import path    from "path";
// import { fileURLToPath } from "url";
// import { verifyToken } from "../middlewares/auth.middleware.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = path.dirname(__filename);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "../uploads"));
//   },
//   filename: (req, file, cb) => {
//     const ext  = path.extname(file.originalname);
//     const name = `photo-${Date.now()}${ext}`;
//     cb(null, name);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
//   fileFilter: (req, file, cb) => {
//     const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."));
//   }
// });

// const router = express.Router();

// // POST /api/uploads/photo
// router.post("/uploads/photo", verifyToken, upload.single("photo"), (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
//   res.json({ url: `/uploads/${req.file.filename}` });
// });

// export default router;
