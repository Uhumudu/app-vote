// backend/controllers/resultat.controller.js
import { pool } from "../config/db.js";

// ================= RESULTATS COMPLETS D'UNE ELECTION =================
export const getResultatsElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    // Vérifier que l'élection existe et appartient à l'admin
    const [elecRows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin, s.type
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.id_election = ?`,
      [electionId]
    );

    if (elecRows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    const election = elecRows[0];

    // Total votes exprimés
    const [totalRows] = await pool.execute(
      `SELECT COUNT(*) AS total_votes FROM vote WHERE election_id = ?`,
      [electionId]
    );
    const totalVotes = totalRows[0].total_votes;

    // Total électeurs inscrits
    const [totalElecteursRows] = await pool.execute(
      `SELECT COUNT(*) AS total_electeurs FROM electeur_election WHERE election_id = ?`,
      [electionId]
    );
    const totalElecteurs = totalElecteursRows[0].total_electeurs;

    // Résultats par candidat (scrutin UNINOMINAL / BINOMINAL)
    const [candidatsRows] = await pool.execute(`
      SELECT c.id_candidat, c.nom, c.parti, c.age, c.photo,
             COUNT(v.id_vote) AS nb_votes,
             ROUND(
               CASE WHEN ? > 0 THEN (COUNT(v.id_vote) * 100.0 / ?) ELSE 0 END,
               2
             ) AS pourcentage
      FROM candidat c
      LEFT JOIN vote v ON c.id_candidat = v.candidat_id
      WHERE c.election_id = ?
      GROUP BY c.id_candidat
      ORDER BY nb_votes DESC
    `, [totalVotes, totalVotes, electionId]);

    // Résultats par liste (scrutin LISTE)
    const [listesRows] = await pool.execute(`
      SELECT l.id_liste, l.nom AS nom_liste,
             COUNT(DISTINCT v.id_vote) AS nb_votes,
             ROUND(
               CASE WHEN ? > 0 THEN (COUNT(DISTINCT v.id_vote) * 100.0 / ?) ELSE 0 END,
               2
             ) AS pourcentage,
             GROUP_CONCAT(c.nom ORDER BY c.id_candidat SEPARATOR ', ') AS candidats
      FROM liste l
      JOIN candidat c ON c.liste_id = l.id_liste
      LEFT JOIN vote v ON (v.candidat_id = c.id_candidat OR v.candidat2_id = c.id_candidat)
             AND v.election_id = ?
      WHERE l.election_id = ?
      GROUP BY l.id_liste
      ORDER BY nb_votes DESC
    `, [totalVotes, totalVotes, electionId, electionId]);

    res.json({
      election,
      totalVotes,
      totalElecteurs,
      tauxParticipation: totalElecteurs > 0
        ? Math.round((totalVotes / totalElecteurs) * 100 * 100) / 100
        : 0,
      candidats: candidatsRows,
      listes: listesRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= RESULTATS DE TOUTES LES ELECTIONS DE L'ADMIN =================
export const getResultatsAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [elections] = await pool.execute(`
      SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
             s.type,
             COUNT(DISTINCT v.id_vote) AS total_votes,
             COUNT(DISTINCT ee.electeur_id) AS total_electeurs
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      LEFT JOIN vote v ON v.election_id = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.admin_id = ?
      GROUP BY e.id_election
      ORDER BY e.date_debut DESC
    `, [adminId]);

    const result = elections.map(e => ({
      ...e,
      tauxParticipation: e.total_electeurs > 0
        ? Math.round((e.total_votes / e.total_electeurs) * 100 * 100) / 100
        : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
