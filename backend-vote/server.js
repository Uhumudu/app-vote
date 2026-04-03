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
import authRoutes from "./routes/auth.routes.js";
import utilisateursRoutes  from "./routes/utilisateurs.routes.js";
import electionRoutes from "./routes/election.routes.js";
import candidatRoutes from "./routes/candidat.routes.js";
import electeurRoutes  from "./routes/electeur.routes.js";
import resultatRoutes from "./routes/resultat.routes.js";
import dashboardRoutes  from "./routes/dashboard.routes.js";
import dashsuperRoutes  from "./routes/dashsuper.routes.js";
import statistiquesRoutes from "./routes/statistiques.routes.js";
import scrutinListeRoutes from "./routes/scrutin_liste.routes.js";
import superadminElectionsRoutes from "./routes/superadmin_elections.routes.js";
import adminElectionSettingsRoutes from "./routes/adminElectionSettings.routes.js";
import superAdminSettingsRoutes      from "./routes/superAdminSettings.routes.js";
import campayRoutes                  from "./routes/campay.routes.js";
import transactionsCamPayRoutes      from "./routes/superadmin_transactions.routes.js";
import publicElectionRoutes          from "./routes/publicElection.routes.js";
import publicCandidaturesRouter from "./routes/publicCandidatures.routes.js";


// 🔹 Jobs
import { checkDepouillementAuto } from "./jobs/scrutin_liste.job.js";

// 🔹 ESModule dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Application Express
const app = express();

//  Middlewares globaux
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

//Fichiers statiques — uploads
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Création du dossier uploads si absent
const uploadsDir = join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Sous-dossier pour les photos d'élection
const electionsUploadDir = join(__dirname, "uploads/elections");
if (!fs.existsSync(electionsUploadDir)) fs.mkdirSync(electionsUploadDir, { recursive: true });

// Config Multer — photos génériques
const storageGeneral = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `photo-${Date.now()}${ext}`);
  },
});

// Config Multer — photos élections
const storageElection = multer.diskStorage({
  destination: (req, file, cb) => cb(null, electionsUploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `election-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."));
};

const uploadGeneral  = multer({ storage: storageGeneral,  fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadElection = multer({ storage: storageElection, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 ROUTES UPLOAD — sans verifyToken (appelées avant l'auth)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/uploads/photo — photo générique (profil, etc.)
app.post("/api/uploads/photo", (req, res) => {
  uploadGeneral.single("photo")(req, res, (err) => {
    if (err) {
      console.error("Erreur upload photo:", err.message);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu." });
    console.log("Photo uploadée:", req.file.filename);
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// POST /api/upload/election-photo — photo d'élection
app.post("/api/upload/election-photo", (req, res) => {
  uploadElection.single("photo")(req, res, (err) => {
    if (err) {
      console.error("Erreur upload photo élection:", err.message);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu." });
    console.log("Photo élection uploadée:", req.file.filename);
    res.status(201).json({
  url:      `/uploads/elections/${req.file.filename}`,  
  filename: req.file.filename,
    // const url = `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/elections/${req.file.filename}`;
    // res.status(201).json({ url, filename: req.file.filename 
    });
  });
});

// 🔹 ROUTES API

// ── Publiques (avant les routes génériques) ───────────────────────────────────
app.use("/api/public-elections", publicElectionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/campay", campayRoutes);

// ── Utilisateurs & paramètres ─────────────────────────────────────────────────
app.use("/api/utilisateurs", utilisateursRoutes);
app.use("/api/admin-election/settings",adminElectionSettingsRoutes);
app.use("/api/super-admin/settings", superAdminSettingsRoutes);
app.use("/api/super-admin/statistiques", statistiquesRoutes);

// ── Transactions & retraits CamPay ────────────────────────────────────────────
app.use("/api/superadmin/transactions-campay", transactionsCamPayRoutes);

// ── Élections ─────────────────────────────────────────────────────────────────
app.use("/api/elections",                     electionRoutes);
app.use("/api/public-elections", publicCandidaturesRouter);

// ── Routes génériques /api (montées EN DERNIER) ───────────────────────────────
app.use("/api", scrutinListeRoutes);
app.use("/api", candidatRoutes);
app.use("/api", electeurRoutes);
app.use("/api", resultatRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", dashsuperRoutes);
app.use("/api", superadminElectionsRoutes);

//  Swagger 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/", (req, res) => res.send("🚀 API eVote fonctionne !"));


// Serveur HTTP + Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Nouvelle connexion Socket.IO :", socket.id);
  socket.emit("welcome", "Bienvenue sur le serveur eVote !");
});

app.set("io", io);


// CRON — dépouillement automatique (toutes les 60s)
setInterval(async () => {
  await checkDepouillementAuto();
}, 60 * 1000);

checkDepouillementAuto();
console.log("Cron dépouillement automatique activé (toutes les 60s)");


// 🔹 Gestionnaires d'erreurs
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur interne" });
});



// Démarrage
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serveur + Socket.IO lancé sur le port ${PORT}`));