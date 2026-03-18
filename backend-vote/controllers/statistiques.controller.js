// controllers/statistiques.controller.js
import { pool } from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/kpis
// KPIs globaux : élections, utilisateurs
// ─────────────────────────────────────────────────────────────────────────────
export const getKpis = async (req, res) => {
  try {
    // ── Élections ──────────────────────────────────────────────────────────
    const [[elections]] = await pool.query(`
      SELECT
        COUNT(*)                                        AS totalElections,
        SUM(statut = 'APPROUVEE')                       AS valides,
        SUM(statut = 'EN_ATTENTE')                      AS enAttente,
        SUM(statut = 'EN_COURS')                        AS enCours,
        SUM(statut = 'TERMINEE')                        AS terminees,
        SUM(statut = 'SUSPENDUE')                       AS suspendues
      FROM election
    `);

    // ── Utilisateurs ───────────────────────────────────────────────────────
    const [[users]] = await pool.query(`
      SELECT
        COUNT(*)                                        AS totalUsers,
        SUM(role = 'SUPER_ADMIN')                       AS superAdmins,
        SUM(role IN ('ADMIN_ELECTION','ADMIN_ELECTION_PENDING')) AS adminElections,
        SUM(role = 'ELECTEUR' AND actif = 1)            AS electeursActifs,
        SUM(role = 'ELECTEUR' AND actif = 0)            AS electeursInactifs
      FROM utilisateur
    `);

    // ── Votes totaux ───────────────────────────────────────────────────────
    const [[votes]] = await pool.query(`
      SELECT COUNT(*) AS totalVotes FROM vote
    `);

    res.json({
      totalElections:    Number(elections.totalElections)   || 0,
      valides:           Number(elections.valides)          || 0,
      enAttente:         Number(elections.enAttente)        || 0,
      enCours:           Number(elections.enCours)          || 0,
      terminees:         Number(elections.terminees)        || 0,
      suspendues:        Number(elections.suspendues)       || 0,
      totalUsers:        Number(users.totalUsers)           || 0,
      superAdmins:       Number(users.superAdmins)          || 0,
      adminElections:    Number(users.adminElections)       || 0,
      electeursActifs:   Number(users.electeursActifs)      || 0,
      electeursInactifs: Number(users.electeursInactifs)    || 0,
      totalVotes:        Number(votes.totalVotes)           || 0,
    });
  } catch (err) {
    console.error("[statistiques] getKpis:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/elections-par-statut
// Données pour le graphique Bar : nb d'élections par statut
// ─────────────────────────────────────────────────────────────────────────────
export const getElectionsParStatut = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT statut, COUNT(*) AS total
      FROM election
      GROUP BY statut
    `);

    // Tous les statuts possibles avec valeur 0 par défaut
    const defaults = {
      EN_ATTENTE: 0, APPROUVEE: 0, EN_COURS: 0, TERMINEE: 0, SUSPENDUE: 0,
    };
    rows.forEach(r => { defaults[r.statut] = Number(r.total); });

    res.json(defaults);
  } catch (err) {
    console.error("[statistiques] getElectionsParStatut:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/utilisateurs-par-role
// Données pour le graphique Pie : répartition des utilisateurs
// ─────────────────────────────────────────────────────────────────────────────
export const getUtilisateursParRole = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT role, COUNT(*) AS total
      FROM utilisateur
      GROUP BY role
    `);

    const result = {};
    rows.forEach(r => { result[r.role] = Number(r.total); });

    res.json(result);
  } catch (err) {
    console.error("[statistiques] getUtilisateursParRole:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/inscriptions-mensuelles
// Données pour le graphique Line : électeurs inscrits par mois
// Query optionnelle : ?annee=2026
// ─────────────────────────────────────────────────────────────────────────────
export const getInscriptionsMensuelles = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const [rows] = await pool.query(`
      SELECT
        MONTH(date_creation) AS mois,
        COUNT(*)             AS total
      FROM utilisateur
      WHERE YEAR(date_creation) = ? AND role = 'ELECTEUR'
      GROUP BY MONTH(date_creation)
      ORDER BY mois ASC
    `, [annee]);

    // Tableau de 12 mois initialisé à 0
    const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
    const data = Array(12).fill(0);
    rows.forEach(r => { data[r.mois - 1] = Number(r.total); });

    res.json({ labels: moisLabels, data, annee });
  } catch (err) {
    console.error("[statistiques] getInscriptionsMensuelles:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/elections-detail
// Tableau détaillé des élections avec participation
// Query optionnelle : ?statut=APPROUVEE&limit=50
// ─────────────────────────────────────────────────────────────────────────────
export const getElectionsDetail = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const statut = req.query.statut || null;

    let where = "";
    const params = [];

    if (statut) {
      where = "WHERE e.statut = ?";
      params.push(statut);
    }

    const [rows] = await pool.query(`
      SELECT
        e.id_election,
        e.titre,
        e.statut,
        e.date_debut,
        e.date_fin,
        s.type                                          AS type_scrutin,
        CONCAT(u.prenom, ' ', u.nom)                    AS createur,
        COUNT(DISTINCT ee.electeur_id)                  AS nb_inscrits,
        COUNT(DISTINCT v.id_vote)                       AS nb_votes,
        CASE
          WHEN COUNT(DISTINCT ee.electeur_id) = 0 THEN 0
          ELSE ROUND(COUNT(DISTINCT v.id_vote) * 100.0
               / COUNT(DISTINCT ee.electeur_id), 1)
        END                                             AS participation
      FROM election e
      LEFT JOIN utilisateur u  ON u.id = e.admin_id
      LEFT JOIN scrutin s      ON s.election_id = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      LEFT JOIN vote v         ON v.election_id = e.id_election
      ${where}
      GROUP BY e.id_election, e.titre, e.statut, e.date_debut,
               e.date_fin, s.type, createur
      ORDER BY e.date_debut DESC
      LIMIT ?
    `, [...params, limit]);

    res.json(rows);
  } catch (err) {
    console.error("[statistiques] getElectionsDetail:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/alertes
// Alertes automatiques : faible participation, électeurs inactifs, élections proches
// ─────────────────────────────────────────────────────────────────────────────
export const getAlertes = async (req, res) => {
  try {
    const alertes = [];

    // 1. Élections EN_COURS dont la date_fin est dans moins de 48h
    const [prochesFin] = await pool.query(`
      SELECT titre, date_fin
      FROM election
      WHERE statut = 'EN_COURS'
        AND date_fin BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)
    `);
    prochesFin.forEach(e => {
      alertes.push({
        type: "warning",
        msg: `Élection "${e.titre}" approche de sa date de fin (${new Date(e.date_fin).toLocaleDateString("fr-FR")}).`,
      });
    });

    // 2. Électeurs inactifs depuis plus de 30 jours
    const [[{ inactifs }]] = await pool.query(`
      SELECT COUNT(*) AS inactifs
      FROM utilisateur
      WHERE role = 'ELECTEUR' AND actif = 0
    `);
    if (Number(inactifs) > 0) {
      alertes.push({
        type: "info",
        msg: `${inactifs} électeur(s) inactif(s) sur la plateforme.`,
      });
    }

    // 3. Élections terminées avec participation < 30%
    const [faibleParticipation] = await pool.query(`
      SELECT e.titre,
        CASE
          WHEN COUNT(DISTINCT ee.electeur_id) = 0 THEN 0
          ELSE ROUND(COUNT(DISTINCT v.id_vote) * 100.0
               / COUNT(DISTINCT ee.electeur_id), 1)
        END AS participation
      FROM election e
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      LEFT JOIN vote v ON v.election_id = e.id_election
      WHERE e.statut = 'TERMINEE'
      GROUP BY e.id_election, e.titre
      HAVING participation < 30 AND participation >= 0
      LIMIT 5
    `);
    faibleParticipation.forEach(e => {
      alertes.push({
        type: "danger",
        msg: `Faible participation (${e.participation}%) détectée sur "${e.titre}".`,
      });
    });

    res.json(alertes);
  } catch (err) {
    console.error("[statistiques] getAlertes:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/statistiques/export-csv
// Export CSV du tableau des élections
// ─────────────────────────────────────────────────────────────────────────────
export const exportCSV = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.titre,
        s.type                                          AS type_scrutin,
        CONCAT(u.prenom, ' ', u.nom)                    AS createur,
        DATE_FORMAT(e.date_debut, '%Y-%m-%d')           AS date_debut,
        DATE_FORMAT(e.date_fin,   '%Y-%m-%d')           AS date_fin,
        e.statut,
        COUNT(DISTINCT ee.electeur_id)                  AS nb_inscrits,
        COUNT(DISTINCT v.id_vote)                       AS nb_votes,
        CASE
          WHEN COUNT(DISTINCT ee.electeur_id) = 0 THEN 0
          ELSE ROUND(COUNT(DISTINCT v.id_vote) * 100.0
               / COUNT(DISTINCT ee.electeur_id), 1)
        END                                             AS participation
      FROM election e
      LEFT JOIN utilisateur u       ON u.id = e.admin_id
      LEFT JOIN scrutin s           ON s.election_id = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      LEFT JOIN vote v              ON v.election_id = e.id_election
      GROUP BY e.id_election, e.titre, s.type, createur,
               e.date_debut, e.date_fin, e.statut
      ORDER BY e.date_debut DESC
    `);

    const header = "Titre,Type,Créateur,Début,Fin,Statut,Inscrits,Votes,Participation\n";
    const csv = header + rows.map(r =>
      `"${r.titre}","${r.type_scrutin || ''}","${r.createur}",` +
      `"${r.date_debut}","${r.date_fin}","${r.statut}",` +
      `${r.nb_inscrits},${r.nb_votes},${r.participation}%`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="statistiques_${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM pour Excel
  } catch (err) {
    console.error("[statistiques] exportCSV:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
