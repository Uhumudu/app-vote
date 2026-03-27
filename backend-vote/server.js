import "dotenv/config";
console.log("MAIL_USER:", process.env.MAIL_USER);
import express from "express";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

// 🔹 Routes
import authRoutes          from "./routes/auth.routes.js";
import utilisateursRoutes  from "./routes/utilisateurs.routes.js";
import electionRoutes      from "./routes/election.routes.js";
import candidatRoutes      from "./routes/candidat.routes.js";
import electeurRoutes      from "./routes/electeur.routes.js";
import resultatRoutes      from "./routes/resultat.routes.js";
import dashboardRoutes     from "./routes/dashboard.routes.js";
import dashsuperRoutes     from "./routes/dashsuper.routes.js";
import statistiquesRoutes  from "./routes/statistiques.routes.js";
import scrutinListeRoutes  from "./routes/scrutin_liste.routes.js";
import superadminElectionsRoutes       from "./routes/superadmin_elections.routes.js";
import adminElectionSettingsRoutes     from "./routes/adminElectionSettings.routes.js";
import superAdminSettingsRoutes        from "./routes/superAdminSettings.routes.js";
import statistiquesSuperAdminRoutes    from "./routes/statistiques.routes.js";

// 🔹 Jobs
import { checkDepouillementAuto } from "./jobs/scrutin_liste.job.js";

// 🔹 ESModule dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// 🔹 Création de l'application Express
const app = express();

// 🔹 Middlewares globaux
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// ✅ UPLOAD inline — AVANT toutes les routes protégées par verifyToken
const uploadsDir = join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."));
  }
});

// POST /api/uploads/photo — sans verifyToken
app.post("/api/uploads/photo", (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      console.error("Erreur upload:", err.message);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
    console.log("Photo uploadée:", req.file.filename);
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// 🔹 Routes API
// 🔹 Routes API
app.use("/api/auth",         authRoutes);
app.use("/api/utilisateurs", utilisateursRoutes);
app.use("/api",              scrutinListeRoutes);      // ← DÉPLACÉ ICI en premier
app.use("/api/elections",    electionRoutes);          // ← après
app.use("/api",              candidatRoutes);
app.use("/api",              electeurRoutes);
app.use("/api",              resultatRoutes);
app.use("/api",              dashboardRoutes);
app.use("/api",              dashsuperRoutes);
app.use("/api",              statistiquesRoutes);
app.use("/api",              superadminElectionsRoutes);
app.use("/api/admin-election/settings", adminElectionSettingsRoutes);
app.use("/api/super-admin/settings",    superAdminSettingsRoutes);
app.use("/api/super-admin/statistiques", statistiquesSuperAdminRoutes);








// app.use("/api/auth",          authRoutes);
// app.use("/api/utilisateurs",  utilisateursRoutes);
// app.use("/api/elections",     electionRoutes);
// app.use("/api",               candidatRoutes);
// app.use("/api",               electeurRoutes);
// app.use("/api",               resultatRoutes);
// app.use("/api",               dashboardRoutes);
// app.use("/api",               dashsuperRoutes);
// app.use("/api",               statistiquesRoutes);
// app.use("/api",               scrutinListeRoutes);
// app.use("/api",               superadminElectionsRoutes);
// app.use("/api/admin-election/settings", adminElectionSettingsRoutes);
// app.use("/api/super-admin/settings",    superAdminSettingsRoutes);
// app.use("/api/super-admin/statistiques", statistiquesSuperAdminRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/", (req, res) => res.send("🚀 API eVote fonctionne !"));

// 🔹 Serveur HTTP + Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("Nouvelle connexion Socket.IO :", socket.id);
  socket.emit("welcome", "Bienvenue sur le serveur eVote !");
});

app.set("io", io);

// ─── CRON dépouillement automatique ──────────────────────────────────────────
setInterval(async () => {
  await checkDepouillementAuto();
}, 60 * 1000);

checkDepouillementAuto();
console.log("Cron dépouillement automatique activé (toutes les 60s)");

// 🔹 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// 🔹 Erreur serveur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur interne" });
});

// 🔹 Démarrage
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serveur + Socket.IO lancé sur ${PORT}`));



