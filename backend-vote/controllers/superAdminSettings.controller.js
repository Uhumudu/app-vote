// controllers/superAdminSettings.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// ─── UTILISATEURS ────────────────────────────────────────────────────────────

export const getUsers = async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%";

    const [rows] = await pool.query(
      `SELECT id, nom, prenom, email, role, actif,
              DATE_FORMAT(date_creation, '%d %b. %Y') AS created
       FROM utilisateur
       WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ?
       ORDER BY date_creation DESC`,
      [search, search, search]
    );

    res.json(rows);
  } catch (err) {
    console.error("[superAdminSettings] getUsers:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({ message: "Nom, prénom, email et mot de passe sont requis." });
    }

    const VALID_ROLES = ["SUPER_ADMIN", "ADMIN_ELECTION", "ADMIN_ELECTION_PENDING", "ELECTEUR"];
    const userRole = VALID_ROLES.includes(role) ? role : "ELECTEUR";

    const [existing] = await pool.query(
      "SELECT id FROM utilisateur WHERE email = ?", [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Un compte avec cet email existe déjà." });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?, 1)`,
      [nom, prenom, email, hash, userRole]
    );

    res.status(201).json({ message: "Utilisateur créé avec succès.", id: result.insertId });
  } catch (err) {
    console.error("[superAdminSettings] createUser:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: "Nom, prénom et email sont requis." });
    }

    const VALID_ROLES = ["SUPER_ADMIN", "ADMIN_ELECTION", "ADMIN_ELECTION_PENDING", "ELECTEUR"];
    const userRole = VALID_ROLES.includes(role) ? role : "ELECTEUR";

    const [existing] = await pool.query(
      "SELECT id FROM utilisateur WHERE email = ? AND id != ?", [email, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte." });
    }

    const [result] = await pool.query(
      `UPDATE utilisateur SET nom = ?, prenom = ?, email = ?, role = ? WHERE id = ?`,
      [nom, prenom, email, userRole, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json({ message: "Utilisateur modifié avec succès." });
  } catch (err) {
    console.error("[superAdminSettings] updateUser:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT actif FROM utilisateur WHERE id = ?", [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const newStatus = rows[0].actif ? 0 : 1;
    await pool.query("UPDATE utilisateur SET actif = ? WHERE id = ?", [newStatus, id]);

    res.json({
      message: `Utilisateur ${newStatus ? "activé" : "désactivé"} avec succès.`,
      actif: !!newStatus,
    });
  } catch (err) {
    console.error("[superAdminSettings] toggleUserStatus:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    const [result] = await pool.query("DELETE FROM utilisateur WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (err) {
    console.error("[superAdminSettings] deleteUser:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── RÔLES ───────────────────────────────────────────────────────────────────

export const getRoles = async (req, res) => {
  res.json([
    {
      role: "SUPER_ADMIN",
      label: "Super Administrateur",
      description: "Accès complet à toutes les fonctionnalités.",
      permissions: [
        { label: "Gérer les utilisateurs",    granted: true  },
        { label: "Gérer les élections",       granted: true  },
        { label: "Voir les logs système",     granted: true  },
        { label: "Modifier la configuration", granted: true  },
        { label: "Exporter les données",      granted: true  },
      ],
    },
    {
      role: "ADMIN_ELECTION",
      label: "Admin d'Élection",
      description: "Crée et gère ses propres élections.",
      permissions: [
        { label: "Créer une élection",     granted: true  },
        { label: "Gérer ses électeurs",    granted: true  },
        { label: "Voir les résultats",     granted: true  },
        { label: "Gérer les utilisateurs", granted: false },
        { label: "Accès aux logs système", granted: false },
      ],
    },
    {
      role: "ELECTEUR",
      label: "Électeur",
      description: "Participe aux élections auxquelles il est inscrit.",
      permissions: [
        { label: "Voter",                  granted: true  },
        { label: "Voir les résultats",     granted: true  },
        { label: "Modifier son profil",    granted: true  },
        { label: "Créer une élection",     granted: false },
        { label: "Accès aux logs système", granted: false },
      ],
    },
  ]);
};

// ─── CONFIGURATION PLATEFORME ────────────────────────────────────────────────

const CONFIG_DEFAULTS = {
  nomPlateforme:      "VoteSecure",
  urlFrontend:        "https://votesecure.cm",
  emailSupport:       "support@votesecure.cm",
  votesMultiples:     false,
  inscriptionOuverte: true,
  maintenance:        false,
  dureeSession:       "24",
};

export const getPlatformConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT message FROM notification
       WHERE utilisateur_id = 0 AND type = 'PLATFORM_CONFIG'
       ORDER BY id_notification DESC LIMIT 1`
    );

    if (rows.length === 0) return res.json(CONFIG_DEFAULTS);

    try {
      res.json({ ...CONFIG_DEFAULTS, ...JSON.parse(rows[0].message) });
    } catch {
      res.json(CONFIG_DEFAULTS);
    }
  } catch (err) {
    console.error("[superAdminSettings] getPlatformConfig:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const updatePlatformConfig = async (req, res) => {
  try {
    const {
      nomPlateforme, urlFrontend, emailSupport,
      votesMultiples, inscriptionOuverte, maintenance, dureeSession,
    } = req.body;

    const config = {
      nomPlateforme:      nomPlateforme      || CONFIG_DEFAULTS.nomPlateforme,
      urlFrontend:        urlFrontend        || CONFIG_DEFAULTS.urlFrontend,
      emailSupport:       emailSupport       || CONFIG_DEFAULTS.emailSupport,
      votesMultiples:     typeof votesMultiples     === "boolean" ? votesMultiples     : CONFIG_DEFAULTS.votesMultiples,
      inscriptionOuverte: typeof inscriptionOuverte === "boolean" ? inscriptionOuverte : CONFIG_DEFAULTS.inscriptionOuverte,
      maintenance:        typeof maintenance        === "boolean" ? maintenance        : CONFIG_DEFAULTS.maintenance,
      dureeSession:       dureeSession       || CONFIG_DEFAULTS.dureeSession,
    };

    await pool.query(
      "DELETE FROM notification WHERE utilisateur_id = 0 AND type = 'PLATFORM_CONFIG'"
    );
    await pool.query(
      "INSERT INTO notification (utilisateur_id, type, message) VALUES (0, 'PLATFORM_CONFIG', ?)",
      [JSON.stringify(config)]
    );

    res.json({ message: "Configuration sauvegardée avec succès.", config });
  } catch (err) {
    console.error("[superAdminSettings] updatePlatformConfig:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── LOGS ─────────────────────────────────────────────────────────────────────

export const getLogs = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 200);
    const page   = Math.max(parseInt(req.query.page)   || 1, 1);
    const offset = (page - 1) * limit;
    const type   = req.query.type || null;

    let where  = "WHERE n.type NOT IN ('PREFS', 'PLATFORM_CONFIG')";
    const params = [];

    if (type && ["info","success","warning","danger"].includes(type)) {
      where += " AND n.type = ?";
      params.push(type);
    }

    const [rows] = await pool.query(
      `SELECT n.id_notification AS id, n.type,
              n.message AS action,
              DATE_FORMAT(n.date_envoi, '%d %b %Y, %H:%i') AS date,
              COALESCE(u.email, 'système') AS user_email
       FROM notification n
       LEFT JOIN utilisateur u ON u.id = n.utilisateur_id
       ${where}
       ORDER BY n.date_envoi DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM notification n ${where}`,
      params
    );

    res.json({ logs: rows, total, page, limit });
  } catch (err) {
    console.error("[superAdminSettings] getLogs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id_notification AS id, n.type,
              n.message AS action,
              DATE_FORMAT(n.date_envoi, '%Y-%m-%d %H:%i:%s') AS date,
              COALESCE(u.email, 'système') AS user_email
       FROM notification n
       LEFT JOIN utilisateur u ON u.id = n.utilisateur_id
       WHERE n.type NOT IN ('PREFS', 'PLATFORM_CONFIG')
       ORDER BY n.date_envoi DESC
       LIMIT 1000`
    );

    const header = "ID,Type,Action,Date,Utilisateur\n";
    const csv = header + rows.map(r =>
      `${r.id},"${r.type}","${(r.action || "").replace(/"/g, '""')}","${r.date}","${r.user_email}"`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="logs_${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM pour Excel
  } catch (err) {
    console.error("[superAdminSettings] exportLogs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
