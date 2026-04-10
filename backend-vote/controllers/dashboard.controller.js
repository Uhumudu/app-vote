// backend/controllers/dashboard.controller.js
import { pool } from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    // ── Mise à jour automatique des statuts ──────────────────────────────────
    await pool.execute(`
      UPDATE election SET statut='EN_COURS'
      WHERE statut='APPROUVEE' AND date_debut <= NOW() AND admin_id = ?
    `, [adminId]);

    await pool.execute(`
      UPDATE election SET statut='TERMINEE'
      WHERE statut='EN_COURS' AND date_fin <= NOW() AND admin_id = ?
    `, [adminId]);

    // ── Nb élections créées par cet admin ────────────────────────────────────
    const [electionsCount] = await pool.execute(
      `SELECT COUNT(*) AS total FROM election WHERE admin_id = ?`,
      [adminId]
    );

    // ── Nb candidats : table candidat + candidat_public (APPROUVE) ───────────
    const [candidatsCount] = await pool.execute(`
      SELECT (
        SELECT COUNT(*)
        FROM candidat c
        JOIN election e ON c.election_id = e.id_election
        WHERE e.admin_id = ?
      ) + (
        SELECT COUNT(*)
        FROM candidat_public cp
        JOIN election e ON cp.election_id = e.id_election
        WHERE e.admin_id = ?
          AND cp.statut = 'APPROUVE'
      ) AS total
    `, [adminId, adminId]);

    // ── Nb votes total (vote + vote_tour + vote_public payés) ────────────────
    const [votesCount] = await pool.execute(`
      SELECT (
        SELECT COUNT(*)
        FROM vote v
        JOIN election e ON v.election_id = e.id_election
        WHERE e.admin_id = ?
      ) + (
        SELECT COUNT(DISTINCT vt.electeur_id)
        FROM vote_tour vt
        JOIN election e ON vt.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vt.tour = 1
      ) + (
        SELECT COALESCE(SUM(vp.nb_voix), 0)
        FROM vote_public vp
        JOIN election e ON vp.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vp.statut_paiement = 'PAYÉ'
      ) AS total
    `, [adminId, adminId, adminId]);

    // ── Nb électeurs inscrits (unique) ───────────────────────────────────────
    const [electeursCount] = await pool.execute(`
      SELECT COUNT(DISTINCT ee.electeur_id) AS total
      FROM electeur_election ee
      JOIN election e ON ee.election_id = e.id_election
      WHERE e.admin_id = ?
    `, [adminId]);

    // ── Taux de participation global ─────────────────────────────────────────
    const tauxParticipation = electeursCount[0].total > 0
      ? Math.round((votesCount[0].total / electeursCount[0].total) * 100 * 100) / 100
      : 0;

    // ── Élection en cours ────────────────────────────────────────────────────
    // Pour les élections publiques, nb_votes vient de vote_public
    // Pour les élections privées, nb_votes vient de vote + vote_tour
    const [electionEnCours] = await pool.execute(`
      SELECT
        e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
        e.visibilite,
        s.type,
        (
          SELECT COUNT(DISTINCT v.id_vote)
          FROM vote v WHERE v.election_id = e.id_election
        ) +
        (
          SELECT COUNT(DISTINCT vt.electeur_id)
          FROM vote_tour vt WHERE vt.election_id = e.id_election AND vt.tour = 1
        ) +
        (
          SELECT COALESCE(SUM(vp.nb_voix), 0)
          FROM vote_public vp
          WHERE vp.election_id = e.id_election AND vp.statut_paiement = 'PAYÉ'
        ) AS nb_votes,
        COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.admin_id = ? AND e.statut = 'EN_COURS'
      GROUP BY e.id_election
      LIMIT 1
    `, [adminId]);

    // ── Candidat en tête ─────────────────────────────────────────────────────
    // Stratégie : on détecte si l'élection utilise candidat_public ou candidat
    let candidatEnTete = null;

    if (electionEnCours.length > 0) {
      const elecId    = electionEnCours[0].id_election;
      const isPublic  = electionEnCours[0].visibilite === 'PUBLIQUE';

      if (isPublic) {
        // Élection publique → candidats dans candidat_public, votes dans vote_public
        const [rows] = await pool.execute(`
          SELECT
            CONCAT(cp.prenom, ' ', cp.nom) AS nom,
            NULL                           AS parti,
            COALESCE(SUM(vp.nb_voix), 0)   AS nb_votes
          FROM candidat_public cp
          LEFT JOIN vote_public vp
            ON vp.candidat_public_id = cp.id
           AND vp.statut_paiement = 'PAYÉ'
          WHERE cp.election_id = ?
            AND cp.statut = 'APPROUVE'
          GROUP BY cp.id
          ORDER BY nb_votes DESC
          LIMIT 1
        `, [elecId]);

        if (rows.length > 0) candidatEnTete = rows[0];

      } else {
        // Élection privée → candidats dans candidat, votes dans vote ou vote_tour
        const [rows] = await pool.execute(`
          SELECT
            c.nom,
            c.parti,
            COUNT(v.id_vote) AS nb_votes
          FROM candidat c
          LEFT JOIN vote v ON c.id_candidat = v.candidat_id
          WHERE c.election_id = ?
          GROUP BY c.id_candidat
          ORDER BY nb_votes DESC
          LIMIT 1
        `, [elecId]);

        if (rows.length > 0) candidatEnTete = rows[0];
      }
    }

    // ── Évolution par HEURE (24 dernières heures) ────────────────────────────
    const [evolutionJour] = await pool.execute(`
      SELECT
        HOUR(date_vote)  AS heure,
        DAY(date_vote)   AS jour,
        MONTH(date_vote) AS mois,
        YEAR(date_vote)  AS annee,
        SUM(nb_voix)     AS nb_votes
      FROM (
        SELECT v.date_vote, 1 AS nb_voix
        FROM vote v
        JOIN election e ON v.election_id = e.id_election
        WHERE e.admin_id = ?
          AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

        UNION ALL

        SELECT vt.date_vote, 1 AS nb_voix
        FROM vote_tour vt
        JOIN election e ON vt.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vt.tour = 1
          AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

        UNION ALL

        SELECT vp.created_at AS date_vote, vp.nb_voix
        FROM vote_public vp
        JOIN election e ON vp.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vp.statut_paiement = 'PAYÉ'
          AND vp.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

      ) AS tous_votes
      GROUP BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote), HOUR(date_vote)
      ORDER BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote), HOUR(date_vote)
    `, [adminId, adminId, adminId]);

    // ── Évolution par JOUR (7 derniers jours) ────────────────────────────────
    const [evolutionSemaine] = await pool.execute(`
      SELECT
        DAY(date_vote)   AS jour,
        MONTH(date_vote) AS mois,
        YEAR(date_vote)  AS annee,
        SUM(nb_voix)     AS nb_votes
      FROM (
        SELECT v.date_vote, 1 AS nb_voix
        FROM vote v
        JOIN election e ON v.election_id = e.id_election
        WHERE e.admin_id = ?
          AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 7 DAY)

        UNION ALL

        SELECT vt.date_vote, 1 AS nb_voix
        FROM vote_tour vt
        JOIN election e ON vt.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vt.tour = 1
          AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 7 DAY)

        UNION ALL

        SELECT vp.created_at AS date_vote, vp.nb_voix
        FROM vote_public vp
        JOIN election e ON vp.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vp.statut_paiement = 'PAYÉ'
          AND vp.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)

      ) AS tous_votes
      GROUP BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote)
      ORDER BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote)
    `, [adminId, adminId, adminId]);

    // ── Évolution par MOIS (12 derniers mois) ────────────────────────────────
    const [evolutionVotes] = await pool.execute(`
      SELECT
        DATE_FORMAT(date_vote, '%b') AS mois,
        MONTH(date_vote)             AS num_mois,
        YEAR(date_vote)              AS annee,
        SUM(nb_voix)                 AS nb_votes
      FROM (
        SELECT v.date_vote, 1 AS nb_voix
        FROM vote v
        JOIN election e ON v.election_id = e.id_election
        WHERE e.admin_id = ?
          AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 12 MONTH)

        UNION ALL

        SELECT vt.date_vote, 1 AS nb_voix
        FROM vote_tour vt
        JOIN election e ON vt.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vt.tour = 1
          AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 12 MONTH)

        UNION ALL

        SELECT vp.created_at AS date_vote, vp.nb_voix
        FROM vote_public vp
        JOIN election e ON vp.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vp.statut_paiement = 'PAYÉ'
          AND vp.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)

      ) AS tous_votes
      GROUP BY YEAR(date_vote), MONTH(date_vote)
      ORDER BY YEAR(date_vote), MONTH(date_vote)
    `, [adminId, adminId, adminId]);

    res.json({
      stats: {
        nb_elections:       electionsCount[0].total,
        nb_candidats:       candidatsCount[0].total,
        nb_votes:           votesCount[0].total,
        taux_participation: tauxParticipation,
      },
      electionEnCours:  electionEnCours[0] || null,
      candidatEnTete,
      evolutionJour,
      evolutionSemaine,
      evolutionVotes,
    });

  } catch (error) {
    console.error("Erreur getDashboardStats:", error);
    res.status(500).json({ error: error.message });
  }
};

























// // backend/controllers/dashboard.controller.js
// import { pool } from "../config/db.js";

// // ================= STATS DASHBOARD ADMIN ELECTION =================
// export const getDashboardStats = async (req, res) => {
//   try {
//     const adminId = req.user.id;

//     // ── Mise à jour automatique des statuts ──────────────────────────────────
//     await pool.execute(`
//       UPDATE election SET statut='EN_COURS'
//       WHERE statut='APPROUVEE' AND date_debut <= NOW() AND admin_id = ?
//     `, [adminId]);

//     await pool.execute(`
//       UPDATE election SET statut='TERMINEE'
//       WHERE statut='EN_COURS' AND date_fin <= NOW() AND admin_id = ?
//     `, [adminId]);

//     // ── Nb élections créées par cet admin ────────────────────────────────────
//     const [electionsCount] = await pool.execute(
//       `SELECT COUNT(*) AS total FROM election WHERE admin_id = ?`,
//       [adminId]
//     );

//     // ── Nb candidats total sur toutes ses élections ──────────────────────────
//     const [candidatsCount] = await pool.execute(`
//       SELECT COUNT(*) AS total
//       FROM candidat c
//       JOIN election e ON c.election_id = e.id_election
//       WHERE e.admin_id = ?
//     `, [adminId]);

//     // ── Nb votes total ───────────────────────────────────────────────────────
//     const [votesCount] = await pool.execute(`
//       SELECT (
//         SELECT COUNT(*)
//         FROM vote v
//         JOIN election e ON v.election_id = e.id_election
//         WHERE e.admin_id = ?
//       ) + (
//         SELECT COUNT(DISTINCT vt.electeur_id)
//         FROM vote_tour vt
//         JOIN election e ON vt.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND vt.tour = 1
//       ) AS total
//     `, [adminId, adminId]);

//     // ── Nb électeurs inscrits (unique) ───────────────────────────────────────
//     const [electeursCount] = await pool.execute(`
//       SELECT COUNT(DISTINCT ee.electeur_id) AS total
//       FROM electeur_election ee
//       JOIN election e ON ee.election_id = e.id_election
//       WHERE e.admin_id = ?
//     `, [adminId]);

//     // ── Taux de participation global ─────────────────────────────────────────
//     const tauxParticipation = electeursCount[0].total > 0
//       ? Math.round((votesCount[0].total / electeursCount[0].total) * 100 * 100) / 100
//       : 0;

//     // ── Élection en cours ────────────────────────────────────────────────────
//     const [electionEnCours] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
//              s.type,
//              COUNT(DISTINCT v.id_vote)      AS nb_votes,
//              COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s ON e.id_election = s.election_id
//       LEFT JOIN vote v ON v.election_id = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.admin_id = ? AND e.statut = 'EN_COURS'
//       GROUP BY e.id_election
//       LIMIT 1
//     `, [adminId]);

//     // ── Candidat en tête ─────────────────────────────────────────────────────
//     let candidatEnTete = null;
//     if (electionEnCours.length > 0) {
//       const [candidatRows] = await pool.execute(`
//         SELECT c.nom, c.parti, COUNT(v.id_vote) AS nb_votes
//         FROM candidat c
//         LEFT JOIN vote v ON c.id_candidat = v.candidat_id
//         WHERE c.election_id = ?
//         GROUP BY c.id_candidat
//         ORDER BY nb_votes DESC
//         LIMIT 1
//       `, [electionEnCours[0].id_election]);

//       if (candidatRows.length > 0) {
//         candidatEnTete = candidatRows[0];
//       }
//     }

//     // ── Évolution par HEURE (24 dernières heures) ────────────────────────────
//     const [evolutionJour] = await pool.execute(`
//       SELECT
//         HOUR(date_vote)  AS heure,
//         DAY(date_vote)   AS jour,
//         MONTH(date_vote) AS mois,
//         YEAR(date_vote)  AS annee,
//         COUNT(*)         AS nb_votes
//       FROM (
//         SELECT v.date_vote
//         FROM vote v
//         JOIN election e ON v.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

//         UNION ALL

//         SELECT vt.date_vote
//         FROM vote_tour vt
//         JOIN election e ON vt.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND vt.tour = 1
//           AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
//       ) AS tous_votes
//       GROUP BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote), HOUR(date_vote)
//       ORDER BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote), HOUR(date_vote)
//     `, [adminId, adminId]);

//     // ── Évolution par JOUR (7 derniers jours) ────────────────────────────────
//     const [evolutionSemaine] = await pool.execute(`
//       SELECT
//         DAY(date_vote)   AS jour,
//         MONTH(date_vote) AS mois,
//         YEAR(date_vote)  AS annee,
//         COUNT(*)         AS nb_votes
//       FROM (
//         SELECT v.date_vote
//         FROM vote v
//         JOIN election e ON v.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 7 DAY)

//         UNION ALL

//         SELECT vt.date_vote
//         FROM vote_tour vt
//         JOIN election e ON vt.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND vt.tour = 1
//           AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//       ) AS tous_votes
//       GROUP BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote)
//       ORDER BY YEAR(date_vote), MONTH(date_vote), DAY(date_vote)
//     `, [adminId, adminId]);

//     // ── Évolution par MOIS (12 derniers mois) ────────────────────────────────
//     // Le front filtre à 6 ou 12 mois selon le toggle, on envoie toujours 12
//     const [evolutionVotes] = await pool.execute(`
//       SELECT
//         DATE_FORMAT(date_vote, '%b') AS mois,
//         MONTH(date_vote)             AS num_mois,
//         YEAR(date_vote)              AS annee,
//         COUNT(*)                     AS nb_votes
//       FROM (
//         SELECT v.date_vote
//         FROM vote v
//         JOIN election e ON v.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 12 MONTH)

//         UNION ALL

//         SELECT vt.date_vote
//         FROM vote_tour vt
//         JOIN election e ON vt.election_id = e.id_election
//         WHERE e.admin_id = ?
//           AND vt.tour = 1
//           AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
//       ) AS tous_votes
//       GROUP BY YEAR(date_vote), MONTH(date_vote)
//       ORDER BY YEAR(date_vote), MONTH(date_vote)
//     `, [adminId, adminId]);

//     res.json({
//       stats: {
//         nb_elections:       electionsCount[0].total,
//         nb_candidats:       candidatsCount[0].total,
//         nb_votes:           votesCount[0].total,
//         taux_participation: tauxParticipation,
//       },
//       electionEnCours:  electionEnCours[0] || null,
//       candidatEnTete,
//       evolutionJour,      // 24h heure par heure
//       evolutionSemaine,   // 7 jours jour par jour
//       evolutionVotes,     // 12 mois (le front filtre à 6 ou 12)
//     });
//   } catch (error) {
//     console.error("Erreur getDashboardStats:", error);
//     res.status(500).json({ error: error.message });
//   }
// };


