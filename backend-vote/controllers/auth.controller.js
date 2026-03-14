// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_votage_2026_secure";

export const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe)
      return res.status(400).json({ message: "Email et mot de passe requis" });

    const [rows] = await pool.execute(
      "SELECT * FROM utilisateur WHERE email = ?",
      [email]
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
      id:      user.id,
      role:    user.role,
      nom:     user.nom,
      prenom:  user.prenom,
      email:   user.email,
    });

  } catch (error) {
    console.error("Erreur LOGIN :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const registerAndCreateElection = async (req, res) => {
  try {
    const {
      nom, prenom, email, motDePasse,
      electionName, electionType,
      startDate, endDate, description,
      nb_sieges,  // ✅ nouveau champ
    } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !electionName || !electionType || !startDate || !endDate)
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });

    // ✅ Validation nb_sieges si type LISTE
    if (electionType === "LISTE" && (!nb_sieges || nb_sieges < 1))
      return res.status(400).json({ message: "Le nombre de sièges est obligatoire pour un scrutin de liste." });

    const formatDate = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");
    const start = formatDate(startDate);
    const end   = formatDate(endDate);

    // 1. Créer utilisateur ADMIN_ELECTION_PENDING
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const [userResult] = await pool.execute(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
       VALUES (?, ?, ?, ?, 'ADMIN_ELECTION_PENDING', 1)`,
      [nom, prenom, email, hashedPassword]
    );
    const userId = userResult.insertId;

    // 2. Créer l'élection
    const [electionResult] = await pool.execute(
      `INSERT INTO election (titre, description, date_debut, date_fin, statut, admin_id)
       VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?)`,
      [electionName, description, start, end, userId]
    );
    const electionId = electionResult.insertId;

    // 3. Créer le scrutin avec nb_sieges si LISTE
    await pool.execute(
      `INSERT INTO scrutin (type, election_id, nb_sieges)
       VALUES (?, ?, ?)`,
      [electionType, electionId, electionType === "LISTE" ? nb_sieges : null]
    );

    res.status(201).json({
      message:    "Compte créé et élection soumise pour validation",
      userId,
      electionId,
    });

  } catch (error) {
    console.error("Erreur registerAndCreateElection :", error);
    res.status(500).json({
      message: "Erreur serveur",
      error:   error.sqlMessage || error.message,
    });
  }
};




































// // backend/controllers/auth.controller.js
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { pool } from "../config/db.js";

// const JWT_SECRET = process.env.JWT_SECRET || "super_votage_2026_secure";

// /**
//  * ================================
//  * 🔐 LOGIN
//  * POST /api/auth/login
//  * ================================
//  */
// export const login = async (req, res) => {
//   try {
//     const { email, mot_de_passe } = req.body;

//     if (!email || !mot_de_passe) {
//       return res.status(400).json({
//         message: "Email et mot de passe requis",
//       });
//     }

//     // 🔎 Vérifier si utilisateur existe
//     const [rows] = await pool.execute(
//       "SELECT * FROM utilisateur WHERE email = ?",
//       [email]
//     );

//     if (rows.length === 0) {
//       return res.status(401).json({ message: "Utilisateur introuvable" });
//     }

//     const user = rows[0];

//     // 🚫 Vérifier si actif
//     if (!user.actif) {
//       return res.status(403).json({ message: "Compte désactivé" });
//     }

//     // 🔑 Vérifier mot de passe
//     const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Mot de passe incorrect" });
//     }

//     // 🎟 Générer JWT
//     const token = jwt.sign(
//       {
//         id: user.id,
//         role: user.role,
//         email: user.email,
//       },
//       JWT_SECRET,
//       { expiresIn: "8h" }
//     );

//     // ✅ Réponse adaptée pour le frontend
//     return res.status(200).json({
//       message: "Connexion réussie",
//       token,        // token à la racine
//       id:     user.id,
//       role: user.role, // rôle à la racine
//       nom: user.nom,
//       prenom: user.prenom,
//       email: user.email
//     });

//   } catch (error) {
//     console.error("Erreur LOGIN :", error);
//     return res.status(500).json({
//       message: "Erreur serveur",
//       error: error.message,
//     });
//   }
// };

// // POST /api/register-and-create-election
// export const registerAndCreateElection = async (req, res) => {
//   try {
//     const {
//       nom,
//       prenom,
//       email,
//       motDePasse,
//       electionName,
//       electionType,
//       startDate,
//       endDate,
//       description
//     } = req.body;

//     // Vérification simple
//     if (!nom || !prenom || !email || !motDePasse || !electionName || !electionType || !startDate || !endDate) {
//       return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
//     }

//     // Formater les dates pour MySQL
//     const formatDate = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');
//     const start = formatDate(startDate);
//     const end = formatDate(endDate);
//     console.log("Start:", start);
// console.log("End:", end);

//     // 1️⃣ Créer utilisateur avec rôle ADMIN_ELECTION_PENDING
//     const hashedPassword = await bcrypt.hash(motDePasse, 10);
//     const [userResult] = await pool.execute(
//       `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//        VALUES (?, ?, ?, ?, 'ADMIN_ELECTION_PENDING', 1)`,
//       [nom, prenom, email, hashedPassword]
//     );
//     const userId = userResult.insertId;

//     // 2️⃣ Créer l’élection avec admin_id = nouvel utilisateur
//     const [electionResult] = await pool.execute(
//       `INSERT INTO election (titre, description, date_debut, date_fin, statut, admin_id)
//        VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?)`,
//       [electionName, description, start, end, userId]
//     );
//     const electionId = electionResult.insertId;

//     // 3️⃣ Créer le scrutin
//     await pool.execute(
//       `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//       [electionType, electionId]
//     );

//     res.status(201).json({
//       message: "Compte créé et élection soumise pour validation",
//       userId,
//       electionId
//     });
//   } catch (error) {
//     console.error("Erreur registerAndCreateElection :", error);
//     res.status(500).json({
//       message: "Erreur serveur",
//       error: error.sqlMessage || error.message
//     });
//   }
// };