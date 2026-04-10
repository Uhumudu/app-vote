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

    // ✅ FIX — on inclut aussi les votes publics payés
    const [[{ totalVotes }]] = await pool.execute(`
      SELECT (
        SELECT COUNT(*) FROM vote
      ) + (
        SELECT COUNT(DISTINCT electeur_id)
        FROM vote_tour
        WHERE tour = 1
      ) + (
        SELECT COALESCE(SUM(nb_voix), 0)
        FROM vote_public
        WHERE statut_paiement = 'PAYÉ'
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

    // ✅ FIX PRINCIPAL — évolution des votes : fusion des 3 sources (vote, vote_tour, vote_public)
    // On groupe par mois de la date réelle du vote (pas date_debut de l'élection)
    const [evolutionVotes] = await pool.execute(`
      SELECT
        DATE_FORMAT(mois_date, '%b %Y')  AS mois,
        DATE_FORMAT(mois_date, '%Y-%m')  AS mois_sort,
        MONTH(mois_date)                 AS num_mois,
        YEAR(mois_date)                  AS annee,
        SUM(nb_votes)                    AS nb_votes
      FROM (

        -- Source 1 : votes directs (élections uninominales / binominales)
        SELECT
          DATE_FORMAT(v.date_vote, '%Y-%m-01') AS mois_date,
          COUNT(*)                              AS nb_votes
        FROM vote v
        WHERE v.date_vote >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(v.date_vote, '%Y-%m-01')

        UNION ALL

        -- Source 2 : votes de liste (vote_tour, on prend tour = 1 pour éviter doublons)
        SELECT
          DATE_FORMAT(vt.date_vote, '%Y-%m-01') AS mois_date,
          COUNT(DISTINCT vt.electeur_id)         AS nb_votes
        FROM vote_tour vt
        WHERE vt.tour = 1
          AND vt.date_vote >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(vt.date_vote, '%Y-%m-01')

        UNION ALL

        -- Source 3 : votes publics payés (avec montant = nb_voix achetées)
        SELECT
          DATE_FORMAT(vp.created_at, '%Y-%m-01') AS mois_date,
          SUM(vp.nb_voix)                         AS nb_votes
        FROM vote_public vp
        WHERE vp.statut_paiement = 'PAYÉ'
          AND vp.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(vp.created_at, '%Y-%m-01')

      ) AS toutes_sources
      GROUP BY DATE_FORMAT(mois_date, '%Y-%m'), DATE_FORMAT(mois_date, '%b %Y'),
               MONTH(mois_date), YEAR(mois_date)
      ORDER BY DATE_FORMAT(mois_date, '%Y-%m') ASC
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
        num_mois: Number(e.num_mois),
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

//     // ✅ FIX — num_mois ajouté pour que le frontend puisse matcher avec le squelette des 6 mois
//     const [evolutionVotes] = await pool.execute(`
//       SELECT
//         DATE_FORMAT(e.date_debut, '%b %Y')  AS mois,
//         DATE_FORMAT(e.date_debut, '%Y-%m')  AS mois_sort,
//         MONTH(e.date_debut)                 AS num_mois,
//         YEAR(e.date_debut)                  AS annee,
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
//       GROUP BY DATE_FORMAT(e.date_debut, '%Y-%m'), DATE_FORMAT(e.date_debut, '%b %Y'), MONTH(e.date_debut), YEAR(e.date_debut)
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
//         num_mois: Number(e.num_mois),  // ✅ champ numérique ajouté
//         annee:    Number(e.annee),
//         nb_votes: Number(e.nb_votes),
//       })),
//       electionsEnAttente,
//     });

//   } catch (error) {
//     console.error("❌ Erreur getSuperAdminStats:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };









