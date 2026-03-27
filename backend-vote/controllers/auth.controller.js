// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_votage_2026_secure";

// ================================
// 🔐 LOGIN
// ================================
export const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe)
      return res.status(400).json({ message: "Email et mot de passe requis" });

    const [rows] = await pool.execute(
      "SELECT * FROM utilisateur WHERE email = ?", [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: "Utilisateur introuvable" });

    const user = rows[0];

    if (!user.actif)
      return res.status(403).json({ message: "Compte désactivé" });

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch)
      return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Connexion réussie",
      token,
      id:     user.id,
      role:   user.role,
      nom:    user.nom,
      prenom: user.prenom,
      email:  user.email,
    });

  } catch (error) {
    console.error("Erreur LOGIN :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ================================
// 📝 REGISTER + CREATE ELECTION
// ================================
export const registerAndCreateElection = async (req, res) => {
  try {
    const {
      nom, prenom, email, motDePasse,
      electionName, electionType,
      startDate, endDate,
      dureeTourMinutes,
      nbSieges,
      description,
    } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !electionName || !electionType || !startDate)
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });

    const isListe = electionType === "LISTE";

    if (!isListe && !endDate)
      return res.status(400).json({ message: "La date de fin est obligatoire." });

    const formatDate = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

    const start = formatDate(startDate);
    const duree = parseInt(dureeTourMinutes) || 1440;
    const siege = parseInt(nbSieges) || 29;

    const end = isListe
      ? formatDate(new Date(new Date(startDate).getTime() + duree * 60000))
      : formatDate(endDate);

    // 1. Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const [userResult] = await pool.execute(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
       VALUES (?, ?, ?, ?, 'ADMIN_ELECTION_PENDING', 1)`,
      [nom, prenom, email, hashedPassword]
    );
    const userId = userResult.insertId;

    // 2. Créer l'élection avec duree_tour_minutes et nb_sieges
    const [electionResult] = await pool.execute(
      `INSERT INTO election (titre, description, date_debut, date_fin, statut, admin_id, duree_tour_minutes, nb_sieges)
       VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?)`,
      [
        electionName,
        description || "",
        start,
        end,
        userId,
        isListe ? duree  : null,
        isListe ? siege  : null,
      ]
    );
    const electionId = electionResult.insertId;

    // 3. Créer le scrutin
    await pool.execute(
      `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
      [electionType, electionId]
    );

    res.status(201).json({
      message: "Compte créé et élection soumise pour validation",
      userId,
      electionId,
    });

  } catch (error) {
    console.error("Erreur registerAndCreateElection :", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.sqlMessage || error.message,
    });
  }
};


