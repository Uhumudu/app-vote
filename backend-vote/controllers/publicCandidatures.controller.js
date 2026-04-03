// backend/controllers/publicCandidatures.controller.js
import { pool } from "../config/db.js";

// GET /api/public-elections/:id/detail
export const getPublicElectionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.description,
             e.date_debut, e.date_fin, e.statut, e.visibilite,
             s.type
      FROM election e
      JOIN scrutin s ON s.election_id = e.id_election
      WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
    `, [id]);

    if (!rows.length)
      return res.status(404).json({ message: "Élection publique introuvable." });

    return res.json({ election: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/public-elections/:id/candidater
export const soumettreCandidat = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, bio, photo_url } = req.body;

    if (!nom || !prenom)
      return res.status(400).json({ message: "Nom et prénom sont obligatoires." });

    const [elec] = await pool.execute(
      `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`, [id]
    );
    if (!elec.length || elec[0].visibilite !== 'PUBLIQUE')
      return res.status(404).json({ message: "Élection publique introuvable." });

    if (['EN_COURS', 'TERMINEE'].includes(elec[0].statut))
      return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

    // Vérifier doublon email
    if (email) {
      const [doublon] = await pool.execute(
        `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`, [id, email]
      );
      if (doublon.length)
        return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
    }

    await pool.execute(
      `INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio, photo_url, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
      [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]
    );

    return res.status(201).json({ message: "Candidature soumise avec succès." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/public-elections/:id/candidatures  (admin)
export const getCandidaturesPubliques = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT cp.*,
             COUNT(vp.id) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id
      WHERE cp.election_id = ?
      GROUP BY cp.id
      ORDER BY cp.created_at DESC
    `, [id]);

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// PUT /api/public-elections/:id/candidatures/:candidatId/review  (admin)
export const reviewCandidature = async (req, res) => {
  try {
    const { id, candidatId } = req.params;
    const { action } = req.body; // "APPROUVE" ou "REJETE"

    if (!['APPROUVE', 'REJETE'].includes(action))
      return res.status(400).json({ message: "Action invalide." });

    const [rows] = await pool.execute(
      `SELECT * FROM candidat_public WHERE id = ? AND election_id = ?`,
      [candidatId, id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Candidature introuvable." });

    const candidat = rows[0];

    await pool.execute(
      `UPDATE candidat_public SET statut = ? WHERE id = ?`,
      [action, candidatId]
    );

    // Si approuvé → insérer dans la table candidat pour qu'il soit visible au vote
    if (action === 'APPROUVE') {
      const nomComplet = `${candidat.prenom} ${candidat.nom}`;
      const [existe] = await pool.execute(
        `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
        [id, nomComplet]
      );
      if (!existe.length) {
        await pool.execute(
          `INSERT INTO candidat (nom, photo, election_id) VALUES (?, ?, ?)`,
          [nomComplet, candidat.photo_url || null, id]
        );
      }
    }

    return res.json({
      message: action === 'APPROUVE'
        ? "Candidature approuvée avec succès."
        : "Candidature rejetée."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};