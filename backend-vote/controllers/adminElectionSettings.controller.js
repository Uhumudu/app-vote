// controllers/adminElectionSettings.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// ─── PROFIL ──────────────────────────────────────────────────────────────────

export const getProfil = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, nom, prenom, email, role, date_creation
       FROM utilisateur
       WHERE id = ? AND role IN ('ADMIN_ELECTION', 'ADMIN_ELECTION_PENDING')`,
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("[adminElectionSettings] getProfil:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const updateProfil = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { nom, prenom, email } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: "Nom, prénom et email sont obligatoires." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM utilisateur WHERE email = ? AND id != ?",
      [email, adminId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte." });
    }

    await pool.query(
      "UPDATE utilisateur SET nom = ?, prenom = ?, email = ? WHERE id = ?",
      [nom, prenom, email, adminId]
    );

    res.json({ message: "Profil mis à jour avec succès." });
  } catch (err) {
    console.error("[adminElectionSettings] updateProfil:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { ancien, nouveau, confirm } = req.body;

    if (!ancien || !nouveau || !confirm) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    if (nouveau.length < 8) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit faire au moins 8 caractères." });
    }
    if (nouveau !== confirm) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
    }

    const [rows] = await pool.query(
      "SELECT mot_de_passe FROM utilisateur WHERE id = ?",
      [adminId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const valid = await bcrypt.compare(ancien, rows[0].mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    const hash = await bcrypt.hash(nouveau, 10);
    await pool.query(
      "UPDATE utilisateur SET mot_de_passe = ? WHERE id = ?",
      [hash, adminId]
    );

    res.json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    console.error("[adminElectionSettings] changePassword:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

const NOTIF_DEFAULTS = {
  email_vote:      true,
  email_resultats: true,
  email_rappel:    false,
  email_securite:  true,
  push_vote:       false,
  push_resultats:  true,
};

const NOTIF_KEYS = Object.keys(NOTIF_DEFAULTS);

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT message FROM notification
       WHERE utilisateur_id = ? AND type = 'PREFS'
       ORDER BY id_notification DESC LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) return res.json(NOTIF_DEFAULTS);

    try {
      res.json({ ...NOTIF_DEFAULTS, ...JSON.parse(rows[0].message) });
    } catch {
      res.json(NOTIF_DEFAULTS);
    }
  } catch (err) {
    console.error("[adminElectionSettings] getNotifications:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const prefs = req.body;

    const sanitized = {};
    NOTIF_KEYS.forEach((k) => {
      sanitized[k] = typeof prefs[k] === "boolean" ? prefs[k] : NOTIF_DEFAULTS[k];
    });

    await pool.query(
      "DELETE FROM notification WHERE utilisateur_id = ? AND type = 'PREFS'",
      [userId]
    );
    await pool.query(
      "INSERT INTO notification (utilisateur_id, type, message) VALUES (?, 'PREFS', ?)",
      [userId, JSON.stringify(sanitized)]
    );

    res.json({ message: "Préférences de notification sauvegardées.", prefs: sanitized });
  } catch (err) {
    console.error("[adminElectionSettings] updateNotifications:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
