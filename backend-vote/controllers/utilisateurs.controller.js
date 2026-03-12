// backend/controllers/utilisateurs.controller.js
import { pool } from "../config/db.js"; // pool MySQL
import bcrypt from "bcryptjs";

// 🔹 GET all utilisateurs
export const getUtilisateurs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nom, prenom, email, role, actif FROM utilisateur"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 GET utilisateur par ID
export const getUtilisateurById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, nom, prenom, email, role, actif FROM utilisateur WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 POST ajouter utilisateur
export const addUtilisateur = async (req, res) => {
  const { nom, prenom, email, motDePasse, role, actif } = req.body;
  if (!nom || !prenom || !email || !motDePasse)
    return res.status(400).json({ message: "Champs requis manquants" });

  try {
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    await pool.query(
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?, ?)",
      [nom, prenom, email, hashedPassword, role || "electeur", actif ? 1 : 0]
    );
    res.status(201).json({ message: "Utilisateur ajouté avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 PUT modifier utilisateur
export const updateUtilisateur = async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, motDePasse, role, actif } = req.body;

  try {
    if (motDePasse && motDePasse.length > 0) {
      const hashedPassword = await bcrypt.hash(motDePasse, 10);
      await pool.query(
        "UPDATE utilisateur SET nom = ?, prenom = ?, email = ?, mot_de_passe = ?, role = ?, actif = ? WHERE id = ?",
        [nom, prenom, email, hashedPassword, role, actif ? 1 : 0, id]
      );
    } else {
      await pool.query(
        "UPDATE utilisateur SET nom = ?, prenom = ?, email = ?, role = ?, actif = ? WHERE id = ?",
        [nom, prenom, email, role, actif ? 1 : 0, id]
      );
    }
    res.json({ message: "Utilisateur modifié avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 DELETE utilisateur
export const deleteUtilisateur = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM utilisateur WHERE id = ?", [id]);
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
