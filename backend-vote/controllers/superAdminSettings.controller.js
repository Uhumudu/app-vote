import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// ─── GESTION DES UTILISATEURS ────────────────────────────────────────────────

/**
 * GET /api/settings/super-admin/users
 * Liste tous les utilisateurs (avec recherche optionnelle ?q=)
 */
export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.q ? `%${req.query.q}%` : "%";

    const [rows] = await db.query(
      `SELECT id, nom, prenom, email, role, actif, date_creation
       FROM utilisateur
       WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ?
       ORDER BY date_creation DESC`,
      [search, search, search]
    );

    res.json(rows);
  } catch (err) {
    console.error("[superAdminSettings] getAllUsers:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * POST /api/settings/super-admin/users
 * Crée un nouvel utilisateur
 */
export const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res
        .status(400)
        .json({ message: "Nom, prénom, email et mot de passe sont requis." });
    }

    const VALID_ROLES = [
      "SUPER_ADMIN",
      "ADMIN_ELECTION",
      "ADMIN_ELECTION_PENDING",
      "ELECTEUR",
    ];
    const userRole = VALID_ROLES.includes(role) ? role : "ELECTEUR";

    // Vérifier unicité de l'email
    const [existing] = await db.query(
      "SELECT id FROM utilisateur WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Un compte avec cet email existe déjà." });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await db.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nom, prenom, email, hash, userRole]
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("[superAdminSettings] createUser:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * PUT /api/settings/super-admin/users/:id
 * Modifie un utilisateur (nom, prénom, email, rôle)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role } = req.body;

    if (!nom || !prenom || !email) {
      return res
        .status(400)
        .json({ message: "Nom, prénom et email sont requis." });
    }

    const VALID_ROLES = [
      "SUPER_ADMIN",
      "ADMIN_ELECTION",
      "ADMIN_ELECTION_PENDING",
      "ELECTEUR",
    ];
    const userRole = VALID_ROLES.includes(role) ? role : "ELECTEUR";

    // Vérifier que l'email n'est pas déjà pris
    const [existing] = await db.query(
      "SELECT id FROM utilisateur WHERE email = ? AND id != ?",
      [email, id]
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Cet email est déjà utilisé par un autre compte." });
    }

    const [result] = await db.query(
      `UPDATE utilisateur
       SET nom = ?, prenom = ?, email = ?, role = ?
       WHERE id = ?`,
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

/**
 * PATCH /api/settings/super-admin/users/:id/toggle
 * Active / désactive un utilisateur
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT actif FROM utilisateur WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const newStatus = rows[0].actif ? 0 : 1;
    await db.query("UPDATE utilisateur SET actif = ? WHERE id = ?", [
      newStatus,
      id,
    ]);

    res.json({
      message: `Utilisateur ${newStatus ? "activé" : "désactivé"} avec succès.`,
      actif: !!newStatus,
    });
  } catch (err) {
    console.error("[superAdminSettings] toggleUserStatus:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * DELETE /api/settings/super-admin/users/:id
 * Supprime un utilisateur
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Empêcher la suppression de soi-même
    if (parseInt(id) === req.user.id) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    const [result] = await db.query("DELETE FROM utilisateur WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (err) {
    console.error("[superAdminSettings] deleteUser:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── RÔLES & PERMISSIONS ─────────────────────────────────────────────────────

/**
 * GET /api/settings/super-admin/roles
 * Retourne la définition statique des rôles et permissions
 * (lecture seule — modifiable uniquement par un redéploiement)
 */
export const getRoles = async (req, res) => {
  const roles = [
    {
      role: "SUPER_ADMIN",
      label: "Super Administrateur",
      description: "Accès complet à toutes les fonctionnalités.",
      permissions: [
        { label: "Gérer les utilisateurs", granted: true },
        { label: "Gérer les élections", granted: true },
        { label: "Voir les logs système", granted: true },
        { label: "Modifier la configuration", granted: true },
        { label: "Exporter les données", granted: true },
      ],
    },
    {
      role: "ADMIN_ELECTION",
      label: "Admin d'Élection",
      description: "Crée et gère ses propres élections.",
      permissions: [
        { label: "Créer une élection", granted: true },
        { label: "Gérer ses électeurs", granted: true },
        { label: "Voir les résultats", granted: true },
        { label: "Gérer les utilisateurs", granted: false },
        { label: "Accès aux logs système", granted: false },
      ],
    },
    {
      role: "ELECTEUR",
      label: "Électeur",
      description: "Participe aux élections auxquelles il est inscrit.",
      permissions: [
        { label: "Voter", granted: true },
        { label: "Voir les résultats", granted: true },
        { label: "Modifier son profil", granted: true },
        { label: "Créer une élection", granted: false },
        { label: "Accès aux logs système", granted: false },
      ],
    },
  ];

  res.json(roles);
};

// ─── STATISTIQUES RAPIDES (utilisateurs) ─────────────────────────────────────

/**
 * GET /api/settings/super-admin/users/stats
 * Statistiques agrégées sur les utilisateurs
 */
export const getUserStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(actif = 1) AS actifs,
         SUM(actif = 0) AS inactifs,
         SUM(role = 'ADMIN_ELECTION') AS admins_election,
         SUM(role = 'SUPER_ADMIN') AS super_admins,
         SUM(role = 'ELECTEUR') AS electeurs
       FROM utilisateur`
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("[superAdminSettings] getUserStats:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── CONFIGURATION PLATEFORME ────────────────────────────────────────────────
// La config est stockée dans la table `notification` avec
// utilisateur_id = 0 (système) et type = 'PLATFORM_CONFIG'.
// Si votre projet possède déjà une table dédiée, adaptez ces requêtes.

const CONFIG_DEFAULTS = {
  nomPlateforme: "VoteSecure",
  urlFrontend: "https://votesecure.cm",
  emailSupport: "support@votesecure.cm",
  votesMultiples: false,
  inscriptionOuverte: true,
  maintenance: false,
  dureeSession: "24",
};

/**
 * GET /api/settings/super-admin/platform
 * Retourne la configuration globale de la plateforme
 */
export const getPlatformConfig = async (req, res) => {
  try {
    const [rows] = await db.query(
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

/**
 * PUT /api/settings/super-admin/platform
 * Sauvegarde la configuration globale
 */
export const updatePlatformConfig = async (req, res) => {
  try {
    const {
      nomPlateforme,
      urlFrontend,
      emailSupport,
      votesMultiples,
      inscriptionOuverte,
      maintenance,
      dureeSession,
    } = req.body;

    const config = {
      nomPlateforme: nomPlateforme || CONFIG_DEFAULTS.nomPlateforme,
      urlFrontend: urlFrontend || CONFIG_DEFAULTS.urlFrontend,
      emailSupport: emailSupport || CONFIG_DEFAULTS.emailSupport,
      votesMultiples: typeof votesMultiples === "boolean" ? votesMultiples : CONFIG_DEFAULTS.votesMultiples,
      inscriptionOuverte: typeof inscriptionOuverte === "boolean" ? inscriptionOuverte : CONFIG_DEFAULTS.inscriptionOuverte,
      maintenance: typeof maintenance === "boolean" ? maintenance : CONFIG_DEFAULTS.maintenance,
      dureeSession: dureeSession || CONFIG_DEFAULTS.dureeSession,
    };

    // Upsert : supprimer puis insérer
    await db.query(
      "DELETE FROM notification WHERE utilisateur_id = 0 AND type = 'PLATFORM_CONFIG'"
    );
    await db.query(
      "INSERT INTO notification (utilisateur_id, type, message) VALUES (0, 'PLATFORM_CONFIG', ?)",
      [JSON.stringify(config)]
    );

    res.json({ message: "Configuration sauvegardée avec succès.", config });
  } catch (err) {
    console.error("[superAdminSettings] updatePlatformConfig:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─── LOGS & ACTIVITÉ ─────────────────────────────────────────────────────────

/**
 * GET /api/settings/super-admin/logs
 * Retourne l'historique des actions (table notification, type != 'PREFS' et != 'PLATFORM_CONFIG')
 * Paramètres optionnels : ?limit=50&offset=0&type=info|success|warning|danger
 */
export const getLogs = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const type   = req.query.type || null;

    let query = `
      SELECT
        n.id_notification AS id,
        n.type,
        n.message AS action,
        n.date_envoi AS date,
        u.email AS user_email
      FROM notification n
      LEFT JOIN utilisateur u ON u.id = n.utilisateur_id
      WHERE n.type NOT IN ('PREFS', 'PLATFORM_CONFIG')
    `;
    const params = [];

    if (type) {
      query += " AND n.type = ?";
      params.push(type);
    }

    query += " ORDER BY n.date_envoi DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) AS total FROM notification
      WHERE type NOT IN ('PREFS', 'PLATFORM_CONFIG')
    `;
    const countParams = [];
    if (type) {
      countQuery += " AND type = ?";
      countParams.push(type);
    }
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({ logs: rows, total, limit, offset });
  } catch (err) {
    console.error("[superAdminSettings] getLogs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * POST /api/settings/super-admin/logs
 * Enregistre une action dans les logs
 * Body : { action, type: 'info'|'success'|'warning'|'danger' }
 */
export const addLog = async (req, res) => {
  try {
    const { action, type } = req.body;
    const userId = req.user?.id || 0;

    const VALID_TYPES = ["info", "success", "warning", "danger"];
    const logType = VALID_TYPES.includes(type) ? type : "info";

    if (!action) {
      return res.status(400).json({ message: "Le champ 'action' est requis." });
    }

    await db.query(
      "INSERT INTO notification (utilisateur_id, type, message) VALUES (?, ?, ?)",
      [userId, logType, action]
    );

    res.status(201).json({ message: "Log enregistré." });
  } catch (err) {
    console.error("[superAdminSettings] addLog:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * GET /api/settings/super-admin/logs/export
 * Export CSV des logs
 */
export const exportLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         n.id_notification AS id,
         n.type,
         n.message AS action,
         n.date_envoi AS date,
         COALESCE(u.email, 'système') AS user_email
       FROM notification n
       LEFT JOIN utilisateur u ON u.id = n.utilisateur_id
       WHERE n.type NOT IN ('PREFS', 'PLATFORM_CONFIG')
       ORDER BY n.date_envoi DESC
       LIMIT 1000`
    );

    const header = "ID,Type,Action,Date,Utilisateur\n";
    const csv =
      header +
      rows
        .map(
          (r) =>
            `${r.id},"${r.type}","${(r.action || "").replace(/"/g, '""')}","${r.date}","${r.user_email}"`
        )
        .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="logs_${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (err) {
    console.error("[superAdminSettings] exportLogs:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
