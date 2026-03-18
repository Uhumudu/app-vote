import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// ─── PROFIL ──────────────────────────────────────────────────────────────────

/**
 * GET /api/settings/admin-election/profil
 * Retourne les infos du profil de l'admin connecté
 */
export const getProfil = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await db.query(
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

/**
 * PUT /api/settings/admin-election/profil
 * Met à jour nom, prénom, email
 */
export const updateProfil = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { nom, prenom, email } = req.body;

    if (!nom || !prenom || !email) {
      return res
        .status(400)
        .json({ message: "Nom, prénom et email sont obligatoires." });
    }

    // Vérifier que l'email n'est pas déjà pris par quelqu'un d'autre
    const [existing] = await db.query(
      "SELECT id FROM utilisateur WHERE email = ? AND id != ?",
      [email, adminId]
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Cet email est déjà utilisé par un autre compte." });
    }

    await db.query(
      "UPDATE utilisateur SET nom = ?, prenom = ?, email = ? WHERE id = ?",
      [nom, prenom, email, adminId]
    );

    res.json({ message: "Profil mis à jour avec succès." });
  } catch (err) {
    console.error("[adminElectionSettings] updateProfil:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * PUT /api/settings/admin-election/password
 * Change le mot de passe de l'admin connecté
 */
export const changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { ancien, nouveau, confirm } = req.body;

    if (!ancien || !nouveau || !confirm) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    if (nouveau.length < 8) {
      return res
        .status(400)
        .json({ message: "Le nouveau mot de passe doit faire au moins 8 caractères." });
    }
    if (nouveau !== confirm) {
      return res
        .status(400)
        .json({ message: "Les mots de passe ne correspondent pas." });
    }

    const [rows] = await db.query(
      "SELECT mot_de_passe FROM utilisateur WHERE id = ?",
      [adminId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const valid = await bcrypt.compare(ancien, rows[0].mot_de_passe);
    if (!valid) {
      return res
        .status(401)
        .json({ message: "Mot de passe actuel incorrect." });
    }

    const hash = await bcrypt.hash(nouveau, 10);
    await db.query(
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
// Les préférences sont stockées dans la table `notification` existante
// avec type = 'PREFS' et message = JSON stringifié.

const NOTIF_DEFAULTS = {
  email_vote: true,
  email_resultats: true,
  email_rappel: false,
  email_securite: true,
  push_vote: false,
  push_resultats: true,
};

const NOTIF_KEYS = Object.keys(NOTIF_DEFAULTS);

/**
 * GET /api/settings/admin-election/notifications
 * Retourne les préférences de notification de l'admin
 */
export const getNotificationPrefs = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
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
    console.error("[adminElectionSettings] getNotificationPrefs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * PUT /api/settings/admin-election/notifications
 * Sauvegarde les préférences de notification
 */
export const updateNotificationPrefs = async (req, res) => {
  try {
    const userId = req.user.id;
    const prefs = req.body;

    // Filtrer uniquement les clés attendues et forcer des booléens
    const sanitized = {};
    NOTIF_KEYS.forEach((k) => {
      sanitized[k] =
        typeof prefs[k] === "boolean" ? prefs[k] : NOTIF_DEFAULTS[k];
    });

    // Upsert : supprimer l'ancienne entrée puis insérer
    await db.query(
      "DELETE FROM notification WHERE utilisateur_id = ? AND type = 'PREFS'",
      [userId]
    );
    await db.query(
      "INSERT INTO notification (utilisateur_id, type, message) VALUES (?, 'PREFS', ?)",
      [userId, JSON.stringify(sanitized)]
    );

    res.json({
      message: "Préférences de notification sauvegardées.",
      prefs: sanitized,
    });
  } catch (err) {
    console.error("[adminElectionSettings] updateNotificationPrefs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
