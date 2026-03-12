import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/candidats",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `candidat_${Date.now()}${ext}`);
  }
});

export const uploadCandidatPhoto = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Seules les images sont autorisées"));
    }
    cb(null, true);
  }
});