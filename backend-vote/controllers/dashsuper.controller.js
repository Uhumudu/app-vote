// backend/controllers/dashsuper.controller.js
import { pool } from "../config/db.js";

export const getSuperAdminStats = async (req, res) => {
  try {

    const [[{ totalUtilisateurs }]] = await pool.execute(
      `SELECT COUNT(*) AS totalUtilisateurs FROM utilisateur`
    );

    const [[{ totalElections }]] = await pool.execute(
      `SELECT COUNT(*) AS totalElections FROM election`
    );

    const [[{ enAttente }]] = await pool.execute(
      `SELECT COUNT(*) AS enAttente FROM election WHERE statut = 'EN_ATTENTE'`
    );

    const [[{ totalElecteurs }]] = await pool.execute(
      `SELECT COUNT(*) AS totalElecteurs FROM electeur_election`
    );

    const [[{ totalVotes }]] = await pool.execute(`
      SELECT (
        SELECT COUNT(*) FROM vote
      ) + (
        SELECT COUNT(DISTINCT electeur_id)
        FROM vote_tour
        WHERE tour = 1
      ) AS totalVotes
    `);

    const [[{ enCours }]] = await pool.execute(
      `SELECT COUNT(*) AS enCours FROM election WHERE statut = 'EN_COURS'`
    );

    const [[{ terminees }]] = await pool.execute(
      `SELECT COUNT(*) AS terminees FROM election WHERE statut = 'TERMINEE'`
    );

    const tauxParticipation = Number(totalElecteurs) > 0
      ? Math.round((Number(totalVotes) / Number(totalElecteurs)) * 100)
      : 0;

    // ✅ FIX — num_mois ajouté pour que le frontend puisse matcher avec le squelette des 6 mois
    const [evolutionVotes] = await pool.execute(`
      SELECT
        DATE_FORMAT(e.date_debut, '%b %Y')  AS mois,
        DATE_FORMAT(e.date_debut, '%Y-%m')  AS mois_sort,
        MONTH(e.date_debut)                 AS num_mois,
        YEAR(e.date_debut)                  AS annee,
        COALESCE(SUM(votes_directs), 0) + COALESCE(SUM(votes_liste), 0) AS nb_votes
      FROM election e
      LEFT JOIN (
        SELECT v.election_id, COUNT(*) AS votes_directs
        FROM vote v
        GROUP BY v.election_id
      ) vd ON vd.election_id = e.id_election
      LEFT JOIN (
        SELECT vt.election_id, COUNT(DISTINCT vt.electeur_id) AS votes_liste
        FROM vote_tour vt
        WHERE vt.tour = 1
        GROUP BY vt.election_id
      ) vl ON vl.election_id = e.id_election
      WHERE e.date_debut >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(e.date_debut, '%Y-%m'), DATE_FORMAT(e.date_debut, '%b %Y'), MONTH(e.date_debut), YEAR(e.date_debut)
      ORDER BY DATE_FORMAT(e.date_debut, '%Y-%m') ASC
    `);

    const [electionsEnAttente] = await pool.execute(`
      SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
             u.nom AS admin_nom, u.prenom AS admin_prenom, u.email AS admin_email
      FROM election e
      JOIN utilisateur u ON e.admin_id = u.id
      WHERE e.statut = 'EN_ATTENTE'
      ORDER BY e.date_debut ASC
      LIMIT 5
    `);

    console.log("📊 Stats:", {
      totalUtilisateurs: Number(totalUtilisateurs),
      totalElections:    Number(totalElections),
      enAttente:         Number(enAttente),
      enCours:           Number(enCours),
      terminees:         Number(terminees),
      tauxParticipation,
      totalVotes:        Number(totalVotes),
      totalElecteurs:    Number(totalElecteurs),
    });

    res.json({
      totalUtilisateurs:  Number(totalUtilisateurs),
      totalElections:     Number(totalElections),
      enAttente:          Number(enAttente),
      enCours:            Number(enCours),
      terminees:          Number(terminees),
      tauxParticipation,
      totalVotes:         Number(totalVotes),
      totalElecteurs:     Number(totalElecteurs),
      evolutionVotes:     evolutionVotes.map(e => ({
        mois:     e.mois,
        num_mois: Number(e.num_mois),  // ✅ champ numérique ajouté
        annee:    Number(e.annee),
        nb_votes: Number(e.nb_votes),
      })),
      electionsEnAttente,
    });

  } catch (error) {
    console.error("❌ Erreur getSuperAdminStats:", error.message);
    res.status(500).json({ error: error.message });
  }
};
































// // backend/controllers/dashsuper.controller.js
// import { pool } from "../config/db.js";

// export const getSuperAdminStats = async (req, res) => {
//   try {

//     const [[{ totalUtilisateurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalUtilisateurs FROM utilisateur`
//     );

//     const [[{ totalElections }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElections FROM election`
//     );

//     const [[{ enAttente }]] = await pool.execute(
//       `SELECT COUNT(*) AS enAttente FROM election WHERE statut = 'EN_ATTENTE'`
//     );

//     const [[{ totalElecteurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElecteurs FROM electeur_election`
//     );

//     // ✅ FIX — totalVotes : union vote (UNINOMINAL/BINOMINAL) + vote_tour tour=1 (LISTE)
//     // On ne se fie plus à a_vote = 1 seul, qui ignore les votes enregistrés dans vote_tour
//     const [[{ totalVotes }]] = await pool.execute(`
//       SELECT (
//         SELECT COUNT(*) FROM vote
//       ) + (
//         SELECT COUNT(DISTINCT electeur_id)
//         FROM vote_tour
//         WHERE tour = 1
//       ) AS totalVotes
//     `);

//     const [[{ enCours }]] = await pool.execute(
//       `SELECT COUNT(*) AS enCours FROM election WHERE statut = 'EN_COURS'`
//     );

//     const [[{ terminees }]] = await pool.execute(
//       `SELECT COUNT(*) AS terminees FROM election WHERE statut = 'TERMINEE'`
//     );

//     const tauxParticipation = Number(totalElecteurs) > 0
//       ? Math.round((Number(totalVotes) / Number(totalElecteurs)) * 100)
//       : 0;

//     // ✅ FIX — evolutionVotes : union vote + vote_tour pour inclure les scrutins LISTE
//     const [evolutionVotes] = await pool.execute(`
//       SELECT
//         DATE_FORMAT(e.date_debut, '%b %Y') AS mois,
//         DATE_FORMAT(e.date_debut, '%Y-%m') AS mois_sort,
//         COALESCE(SUM(votes_directs), 0) + COALESCE(SUM(votes_liste), 0) AS nb_votes
//       FROM election e
//       LEFT JOIN (
//         SELECT v.election_id, COUNT(*) AS votes_directs
//         FROM vote v
//         GROUP BY v.election_id
//       ) vd ON vd.election_id = e.id_election
//       LEFT JOIN (
//         SELECT vt.election_id, COUNT(DISTINCT vt.electeur_id) AS votes_liste
//         FROM vote_tour vt
//         WHERE vt.tour = 1
//         GROUP BY vt.election_id
//       ) vl ON vl.election_id = e.id_election
//       WHERE e.date_debut >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
//       GROUP BY DATE_FORMAT(e.date_debut, '%Y-%m'), DATE_FORMAT(e.date_debut, '%b %Y')
//       ORDER BY DATE_FORMAT(e.date_debut, '%Y-%m') ASC
//     `);

//     const [electionsEnAttente] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
//              u.nom AS admin_nom, u.prenom AS admin_prenom, u.email AS admin_email
//       FROM election e
//       JOIN utilisateur u ON e.admin_id = u.id
//       WHERE e.statut = 'EN_ATTENTE'
//       ORDER BY e.date_debut ASC
//       LIMIT 5
//     `);

//     console.log("📊 Stats:", {
//       totalUtilisateurs: Number(totalUtilisateurs),
//       totalElections:    Number(totalElections),
//       enAttente:         Number(enAttente),
//       enCours:           Number(enCours),
//       terminees:         Number(terminees),
//       tauxParticipation,
//       totalVotes:        Number(totalVotes),
//       totalElecteurs:    Number(totalElecteurs),
//     });

//     res.json({
//       totalUtilisateurs:  Number(totalUtilisateurs),
//       totalElections:     Number(totalElections),
//       enAttente:          Number(enAttente),
//       enCours:            Number(enCours),
//       terminees:          Number(terminees),
//       tauxParticipation,
//       totalVotes:         Number(totalVotes),
//       totalElecteurs:     Number(totalElecteurs),
//       evolutionVotes:     evolutionVotes.map(e => ({
//         mois:     e.mois,
//         nb_votes: Number(e.nb_votes),
//       })),
//       electionsEnAttente,
//     });

//   } catch (error) {
//     console.error("❌ Erreur getSuperAdminStats:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };



































// // backend/controllers/dashsuper.controller.js
// import { pool } from "../config/db.js";

// export const getSuperAdminStats = async (req, res) => {
//   try {

//     const [[{ totalUtilisateurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalUtilisateurs FROM utilisateur`
//     );

//     const [[{ totalElections }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElections FROM election`
//     );

//     const [[{ enAttente }]] = await pool.execute(
//       `SELECT COUNT(*) AS enAttente FROM election WHERE statut = 'EN_ATTENTE'`
//     );

//     const [[{ totalElecteurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElecteurs FROM electeur_election`
//     );

//     const [[{ totalVotes }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalVotes FROM electeur_election WHERE a_vote = 1`
//     );

//     const [[{ enCours }]] = await pool.execute(
//       `SELECT COUNT(*) AS enCours FROM election WHERE statut = 'EN_COURS'`
//     );

//     const [[{ terminees }]] = await pool.execute(
//       `SELECT COUNT(*) AS terminees FROM election WHERE statut = 'TERMINEE'`
//     );

//     const tauxParticipation = Number(totalElecteurs) > 0
//       ? Math.round((Number(totalVotes) / Number(totalElecteurs)) * 100)
//       : 0;

//     const [evolutionVotes] = await pool.execute(`
//       SELECT 
//         DATE_FORMAT(e.date_debut, '%b %Y') AS mois,
//         COUNT(v.id_vote)                   AS nb_votes
//       FROM election e
//       LEFT JOIN vote v ON v.election_id = e.id_election
//       WHERE e.date_debut >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
//       GROUP BY DATE_FORMAT(e.date_debut, '%Y-%m'), DATE_FORMAT(e.date_debut, '%b %Y')
//       ORDER BY DATE_FORMAT(e.date_debut, '%Y-%m') ASC
//     `);

//     const [electionsEnAttente] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
//              u.nom AS admin_nom, u.prenom AS admin_prenom, u.email AS admin_email
//       FROM election e
//       JOIN utilisateur u ON e.admin_id = u.id
//       WHERE e.statut = 'EN_ATTENTE'
//       ORDER BY e.date_debut ASC
//       LIMIT 5
//     `);

//     // ✅ Log avant res.json
//     console.log("📊 Stats:", {
//       totalUtilisateurs: Number(totalUtilisateurs),
//       totalElections:    Number(totalElections),
//       enAttente:         Number(enAttente),
//       enCours:           Number(enCours),
//       terminees:         Number(terminees),
//       tauxParticipation,
//       totalVotes:        Number(totalVotes),
//       totalElecteurs:    Number(totalElecteurs),
//     });

//     // ✅ Tous les BigInt convertis en Number
//     res.json({
//       totalUtilisateurs:  Number(totalUtilisateurs),
//       totalElections:     Number(totalElections),
//       enAttente:          Number(enAttente),
//       enCours:            Number(enCours),
//       terminees:          Number(terminees),
//       tauxParticipation,
//       totalVotes:         Number(totalVotes),
//       totalElecteurs:     Number(totalElecteurs),
//       evolutionVotes:     evolutionVotes.map(e => ({
//         mois:     e.mois,
//         nb_votes: Number(e.nb_votes),
//       })),
//       electionsEnAttente,
//     });

//   } catch (error) {
//     console.error("❌ Erreur getSuperAdminStats:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };








































// // backend/controllers/dashsuper.controller.js
// import { pool } from "../config/db.js";

// export const getSuperAdminStats = async (req, res) => {
//   try {

//     // ── Nombre total d'utilisateurs ──────────────────────────────────────────
//     const [[{ totalUtilisateurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalUtilisateurs FROM utilisateur`
//     );

//     // ── Nombre total d'élections ──────────────────────────────────────────────
//     const [[{ totalElections }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElections FROM election`
//     );

//     // ── Élections en attente de validation ────────────────────────────────────
//     const [[{ enAttente }]] = await pool.execute(
//       `SELECT COUNT(*) AS enAttente FROM election WHERE statut = 'EN_ATTENTE'`
//     );

//     // ── Taux de participation global ─────────────────────────────────────────
//     const [[{ totalElecteurs }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalElecteurs FROM electeur_election`
//     );
//     const [[{ totalVotes }]] = await pool.execute(
//       `SELECT COUNT(*) AS totalVotes FROM electeur_election WHERE a_vote = 1`
//     );
//     const tauxParticipation = totalElecteurs > 0
//       ? Math.round((totalVotes / totalElecteurs) * 100)
//       : 0;

//     // ── Évolution mensuelle des votes (6 derniers mois) ───────────────────────
//     const [evolutionVotes] = await pool.execute(`
//       SELECT 
//         DATE_FORMAT(e.date_debut, '%b %Y') AS mois,
//         COUNT(v.id_vote)                   AS nb_votes
//       FROM election e
//       LEFT JOIN vote v ON v.election_id = e.id_election
//       WHERE e.date_debut >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
//       GROUP BY DATE_FORMAT(e.date_debut, '%Y-%m'), DATE_FORMAT(e.date_debut, '%b %Y')
//       ORDER BY DATE_FORMAT(e.date_debut, '%Y-%m') ASC
//     `);

//     // ── Élections en attente (liste détaillée) ────────────────────────────────
//     const [electionsEnAttente] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
//              u.nom AS admin_nom, u.prenom AS admin_prenom, u.email AS admin_email
//       FROM election e
//       JOIN utilisateur u ON e.admin_id = u.id
//       WHERE e.statut = 'EN_ATTENTE'
//       ORDER BY e.date_debut ASC
//       LIMIT 5
//     `);

//     // ── Élections en cours ───────────────────────────────────────────────────
//     const [[{ enCours }]] = await pool.execute(
//       `SELECT COUNT(*) AS enCours FROM election WHERE statut = 'EN_COURS'`
//     );

//     // ── Élections terminées ──────────────────────────────────────────────────
//     const [[{ terminees }]] = await pool.execute(
//       `SELECT COUNT(*) AS terminees FROM election WHERE statut = 'TERMINEE'`
//     );

//     res.json({
//       totalUtilisateurs,
//       totalElections,
//       enAttente,
//       enCours,
//       terminees,
//       tauxParticipation,
//       totalVotes,
//       totalElecteurs,
//       evolutionVotes,
//       electionsEnAttente,
//     });

//     console.log("totalUtilisateurs:", totalUtilisateurs);
// console.log("totalElections:", totalElections);
// console.log("enAttente:", enAttente);
// console.log("tauxParticipation:", tauxParticipation);

//   } catch (error) {
//     console.error("❌ Erreur getSuperAdminStats:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };