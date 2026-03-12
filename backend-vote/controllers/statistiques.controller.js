// backend/controllers/statistiques.controller.js
import { pool } from "../config/db.js";

// ================= STATISTIQUES GLOBALES (SUPERADMIN) =================
export const getStatistiquesGlobales = async (req, res) => {
  try {

    // ── KPIs Elections ──────────────────────────────────────────────
    const [[{ totalElections }]] = await pool.execute(
      `SELECT COUNT(*) AS totalElections FROM election`
    );
    const [[{ valides }]] = await pool.execute(
      `SELECT COUNT(*) AS valides FROM election WHERE statut_validation = 'VALIDEE'`
    );
    const [[{ enAttente }]] = await pool.execute(
      `SELECT COUNT(*) AS enAttente FROM election WHERE statut_validation = 'EN_ATTENTE'`
    );
    const [[{ refusees }]] = await pool.execute(
      `SELECT COUNT(*) AS refusees FROM election WHERE statut_validation = 'REFUSEE'`
    );

    // ── KPIs Utilisateurs ───────────────────────────────────────────
    const [[{ totalUsers }]] = await pool.execute(
      `SELECT COUNT(*) AS totalUsers FROM utilisateur`
    );
    const [[{ superAdmins }]] = await pool.execute(
      `SELECT COUNT(*) AS superAdmins FROM utilisateur WHERE role = 'SUPERADMIN'`
    );
    const [[{ adminElections }]] = await pool.execute(
      `SELECT COUNT(*) AS adminElections FROM utilisateur WHERE role = 'ADMIN'`
    );
    const [[{ electeursActifs }]] = await pool.execute(
      `SELECT COUNT(*) AS electeursActifs FROM utilisateur WHERE role = 'ELECTEUR' AND actif = 1`
    );
    const [[{ electeursInactifs }]] = await pool.execute(
      `SELECT COUNT(*) AS electeursInactifs FROM utilisateur WHERE role = 'ELECTEUR' AND actif = 0`
    );

    // ── Elections par statut (chart bar) ────────────────────────────
    const [electionsByStatut] = await pool.execute(
      `SELECT statut_validation AS statut, COUNT(*) AS total
       FROM election
       GROUP BY statut_validation`
    );

    // ── Electeurs inscrits dans le temps (chart line) ───────────────
    const [electeursParMois] = await pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b') AS mois,
             MONTH(created_at)             AS mois_num,
             COUNT(*)                      AS total
      FROM utilisateur
      WHERE role = 'ELECTEUR'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mois, mois_num
      ORDER BY mois_num ASC
    `);

    // ── Participation par élection (chart bar) ──────────────────────
    const [participationParElection] = await pool.execute(`
      SELECT e.titre,
             COUNT(ee.electeur_id)                            AS total_inscrits,
             SUM(ee.a_vote)                                   AS total_votes,
             ROUND(SUM(ee.a_vote) / COUNT(ee.electeur_id) * 100, 1) AS participation
      FROM election e
      JOIN electeur_election ee ON ee.election_id = e.id_election
      GROUP BY e.id_election, e.titre
      ORDER BY e.date_debut DESC
      LIMIT 10
    `);

    // ── Tableau détaillé des élections ─────────────────────────────
    const [electionsTable] = await pool.execute(`
      SELECT e.id_election,
             e.titre,
             s.type,
             u.nom AS createur_nom, u.prenom AS createur_prenom,
             e.date_debut,
             e.date_fin,
             e.statut,
             e.statut_validation,
             COALESCE(ROUND(SUM(ee.a_vote) / NULLIF(COUNT(ee.electeur_id), 0) * 100, 1), 0) AS participation
      FROM election e
      JOIN scrutin s            ON s.election_id  = e.id_election
      JOIN utilisateur u        ON u.id           = e.admin_id
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      GROUP BY e.id_election, e.titre, s.type, u.nom, u.prenom,
               e.date_debut, e.date_fin, e.statut, e.statut_validation
      ORDER BY e.date_debut DESC
    `);

    res.json({
      kpis: {
        totalElections,
        valides,
        enAttente,
        refusees,
        totalUsers,
        superAdmins,
        adminElections,
        electeursActifs,
        electeursInactifs,
      },
      electionsByStatut,
      electeursParMois,
      participationParElection,
      electionsTable,
    });

  } catch (error) {
    console.error("❌ Erreur getStatistiquesGlobales:", error.message);
    res.status(500).json({ error: error.message });
  }
};