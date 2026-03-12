// backend/controllers/electionDetails.controller.js
import { pool } from "../config/db.js";

// ================= DETAILS COMPLETS D'UNE ELECTION =================
export const getElectionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Infos élection
    const [elecRows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.description, e.date_debut, e.date_fin,
             e.statut, s.type AS type_scrutin
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      WHERE e.id_election = ? AND e.admin_id = ?
    `, [id, adminId]);

    if (elecRows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable ou accès refusé" });
    }

    const election = elecRows[0];

    // Candidats
    const [candidats] = await pool.execute(`
      SELECT c.id_candidat, c.nom, c.parti, c.age, c.photo,
             l.id_liste, l.nom AS nom_liste
      FROM candidat c
      LEFT JOIN liste l ON c.liste_id = l.id_liste
      WHERE c.election_id = ?
      ORDER BY l.nom ASC, c.nom ASC
    `, [id]);

    // Listes (scrutin LISTE)
    const [listes] = await pool.execute(`
      SELECT l.id_liste, l.nom,
             GROUP_CONCAT(c.nom ORDER BY c.id_candidat SEPARATOR ', ') AS candidats,
             COUNT(c.id_candidat) AS nb_candidats
      FROM liste l
      LEFT JOIN candidat c ON c.liste_id = l.id_liste
      WHERE l.election_id = ?
      GROUP BY l.id_liste
    `, [id]);

    // Nombre d'électeurs
    const [electeursCount] = await pool.execute(
      `SELECT COUNT(*) AS total FROM electeur_election WHERE election_id = ?`,
      [id]
    );

    // Nombre de votes
    const [votesCount] = await pool.execute(
      `SELECT COUNT(*) AS total FROM vote WHERE election_id = ?`,
      [id]
    );

    res.json({
      election,
      candidats,
      listes,
      stats: {
        nb_candidats: candidats.length,
        nb_electeurs: electeursCount[0].total,
        nb_votes: votesCount[0].total,
        taux_participation: electeursCount[0].total > 0
          ? Math.round((votesCount[0].total / electeursCount[0].total) * 100 * 100) / 100
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
