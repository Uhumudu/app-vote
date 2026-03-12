import "dotenv/config";
console.log("MAIL_USER:", process.env.MAIL_USER);
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";

// 🔹 Routes
import authRoutes          from "./routes/auth.routes.js";
import utilisateursRoutes  from "./routes/utilisateurs.routes.js";
import electionRoutes      from "./routes/election.routes.js";
import candidatRoutes      from "./routes/candidat.routes.js";
import electeurRoutes      from "./routes/electeur.routes.js";
import resultatRoutes      from "./routes/resultat.routes.js";
import dashboardRoutes     from "./routes/dashboard.routes.js";
import dashsuperRoutes     from "./routes/dashsuper.routes.js";
import statistiquesRoutes  from "./routes/statistiques.routes.js"; // ✅ ajouté

// 🔹 ESModule dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// 🔹 Création de l'application Express
const app = express();

// 🔹 Middlewares
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// 🔹 Routes API (préfixe /api)
app.use("/api/auth",          authRoutes);
app.use("/api/utilisateurs",  utilisateursRoutes);
app.use("/api/elections",     electionRoutes);
app.use("/api",               candidatRoutes);
app.use("/api",               electeurRoutes);
app.use("/api",               resultatRoutes);
app.use("/api",               dashboardRoutes);
app.use("/api",               dashsuperRoutes);
app.use("/api",               statistiquesRoutes); // ✅ ajouté

app.get("/", (req, res) => {
  res.send("🚀 API eVote fonctionne !");
});

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

// 🔹 Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// 🔹 Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur interne" });
});

// 🔹 Lancer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Serveur + Socket.IO lancé sur ${PORT}`));