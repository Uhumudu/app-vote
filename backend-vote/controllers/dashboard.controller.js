// backend/controllers/dashboard.controller.js
import { pool } from "../config/db.js";

// ================= STATS DASHBOARD ADMIN ELECTION =================
export const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Mettre à jour les statuts automatiquement
    await pool.execute(`
      UPDATE election SET statut='EN_COURS'
      WHERE statut='APPROUVEE' AND date_debut <= NOW() AND admin_id = ?
    `, [adminId]);

    await pool.execute(`
      UPDATE election SET statut='TERMINEE'
      WHERE statut='EN_COURS' AND date_fin <= NOW() AND admin_id = ?
    `, [adminId]);

    // Nb élections créées par cet admin
    const [electionsCount] = await pool.execute(
      `SELECT COUNT(*) AS total FROM election WHERE admin_id = ?`,
      [adminId]
    );

    // Nb candidats total sur toutes ses élections
    const [candidatsCount] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM candidat c
      JOIN election e ON c.election_id = e.id_election
      WHERE e.admin_id = ?
    `, [adminId]);

    // ✅ FIX — Nb votes total : union vote (UNINOMINAL/BINOMINAL) + vote_tour tour=1 (LISTE)
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
      ) AS total
    `, [adminId, adminId]);

    // Nb électeurs inscrits sur toutes ses élections (unique)
    const [electeursCount] = await pool.execute(`
      SELECT COUNT(DISTINCT ee.electeur_id) AS total
      FROM electeur_election ee
      JOIN election e ON ee.election_id = e.id_election
      WHERE e.admin_id = ?
    `, [adminId]);

    // Taux de participation global
    const tauxParticipation = electeursCount[0].total > 0
      ? Math.round((votesCount[0].total / electeursCount[0].total) * 100 * 100) / 100
      : 0;

    // Élection en cours
    const [electionEnCours] = await pool.execute(`
      SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
             s.type,
             COUNT(DISTINCT v.id_vote) AS nb_votes,
             COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      LEFT JOIN vote v ON v.election_id = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.admin_id = ? AND e.statut = 'EN_COURS'
      GROUP BY e.id_election
      LIMIT 1
    `, [adminId]);

    // Candidat en tête (sur l'élection en cours si elle existe)
    let candidatEnTete = null;
    if (electionEnCours.length > 0) {
      const [candidatRows] = await pool.execute(`
        SELECT c.nom, c.parti, COUNT(v.id_vote) AS nb_votes
        FROM candidat c
        LEFT JOIN vote v ON c.id_candidat = v.candidat_id
        WHERE c.election_id = ?
        GROUP BY c.id_candidat
        ORDER BY nb_votes DESC
        LIMIT 1
      `, [electionEnCours[0].id_election]);

      if (candidatRows.length > 0) {
        candidatEnTete = candidatRows[0];
      }
    }

    // ✅ FIX — Evolution des votes par mois (6 derniers mois) : union vote + vote_tour
    const [evolutionVotes] = await pool.execute(`
      SELECT
        DATE_FORMAT(date_vote, '%b')  AS mois,
        MONTH(date_vote)              AS num_mois,
        COUNT(*)                      AS nb_votes
      FROM (
        SELECT v.date_vote
        FROM vote v
        JOIN election e ON v.election_id = e.id_election
        WHERE e.admin_id = ?
          AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 6 MONTH)

        UNION ALL

        SELECT vt.date_vote
        FROM vote_tour vt
        JOIN election e ON vt.election_id = e.id_election
        WHERE e.admin_id = ?
          AND vt.tour = 1
          AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      ) AS tous_votes
      GROUP BY YEAR(date_vote), MONTH(date_vote)
      ORDER BY YEAR(date_vote), MONTH(date_vote)
    `, [adminId, adminId]);

    res.json({
      stats: {
        nb_elections:      electionsCount[0].total,
        nb_candidats:      candidatsCount[0].total,
        nb_votes:          votesCount[0].total,
        taux_participation: tauxParticipation
      },
      electionEnCours:  electionEnCours[0] || null,
      candidatEnTete,
      evolutionVotes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};







































// // backend/controllers/dashboard.controller.js
// import { pool } from "../config/db.js";

// // ================= STATS DASHBOARD ADMIN ELECTION =================
// export const getDashboardStats = async (req, res) => {
//   try {
//     const adminId = req.user.id;

//     // Mettre à jour les statuts automatiquement
//     await pool.execute(`
//       UPDATE election SET statut='EN_COURS'
//       WHERE statut='APPROUVEE' AND date_debut <= NOW() AND admin_id = ?
//     `, [adminId]);

//     await pool.execute(`
//       UPDATE election SET statut='TERMINEE'
//       WHERE statut='EN_COURS' AND date_fin <= NOW() AND admin_id = ?
//     `, [adminId]);

//     // Nb élections créées par cet admin
//     const [electionsCount] = await pool.execute(
//       `SELECT COUNT(*) AS total FROM election WHERE admin_id = ?`,
//       [adminId]
//     );

//     // Nb candidats total sur toutes ses élections
//     const [candidatsCount] = await pool.execute(`
//       SELECT COUNT(*) AS total
//       FROM candidat c
//       JOIN election e ON c.election_id = e.id_election
//       WHERE e.admin_id = ?
//     `, [adminId]);

//     // Nb votes total sur toutes ses élections
//     const [votesCount] = await pool.execute(`
//       SELECT COUNT(*) AS total
//       FROM vote v
//       JOIN election e ON v.election_id = e.id_election
//       WHERE e.admin_id = ?
//     `, [adminId]);

//     // Nb électeurs inscrits sur toutes ses élections (unique)
//     const [electeursCount] = await pool.execute(`
//       SELECT COUNT(DISTINCT ee.electeur_id) AS total
//       FROM electeur_election ee
//       JOIN election e ON ee.election_id = e.id_election
//       WHERE e.admin_id = ?
//     `, [adminId]);

//     // Taux de participation global
//     const tauxParticipation = electeursCount[0].total > 0
//       ? Math.round((votesCount[0].total / electeursCount[0].total) * 100 * 100) / 100
//       : 0;

//     // Élection en cours
//     const [electionEnCours] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
//              s.type,
//              COUNT(DISTINCT v.id_vote) AS nb_votes,
//              COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s ON e.id_election = s.election_id
//       LEFT JOIN vote v ON v.election_id = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.admin_id = ? AND e.statut = 'EN_COURS'
//       GROUP BY e.id_election
//       LIMIT 1
//     `, [adminId]);

//     // Candidat en tête (sur l'élection en cours si elle existe)
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

//     // Evolution des votes par mois (6 derniers mois)
//     const [evolutionVotes] = await pool.execute(`
//       SELECT DATE_FORMAT(v.date_vote, '%b') AS mois,
//              MONTH(v.date_vote) AS num_mois,
//              COUNT(*) AS nb_votes
//       FROM vote v
//       JOIN election e ON v.election_id = e.id_election
//       WHERE e.admin_id = ?
//         AND v.date_vote >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
//       GROUP BY YEAR(v.date_vote), MONTH(v.date_vote)
//       ORDER BY YEAR(v.date_vote), MONTH(v.date_vote)
//     `, [adminId]);

//     res.json({
//       stats: {
//         nb_elections: electionsCount[0].total,
//         nb_candidats: candidatsCount[0].total,
//         nb_votes: votesCount[0].total,
//         taux_participation: tauxParticipation
//       },
//       electionEnCours: electionEnCours[0] || null,
//       candidatEnTete,
//       evolutionVotes
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
