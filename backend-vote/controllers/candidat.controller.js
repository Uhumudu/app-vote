// backend/controllers/candidat.controller.js
import { pool } from "../config/db.js";

// ================= LISTER LES CANDIDATS D'UNE ELECTION =================
export const getCandidatsByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const [rows] = await pool.execute(`
      SELECT c.id_candidat, c.nom, c.parti, c.age, c.photo,
             l.id_liste, l.nom AS nom_liste,
             s.type AS type_scrutin
      FROM candidat c
      LEFT JOIN liste l ON c.liste_id = l.id_liste
      JOIN election e ON c.election_id = e.id_election
      JOIN scrutin s ON e.id_election = s.election_id
      WHERE c.election_id = ?
      ORDER BY l.nom ASC, c.nom ASC
    `, [electionId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= AJOUTER UN CANDIDAT =================
export const createCandidat = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { nom, parti, age, photo, liste_id } = req.body;

    if (!nom) {
      return res.status(400).json({ message: "Le nom est obligatoire" });
    }

    // Vérifier que l'élection appartient à cet admin
    const adminId = req.user.id;
    const [elecRows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });
    }

    if (elecRows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible d'ajouter un candidat à une élection terminée" });
    }

    const [result] = await pool.execute(
      `INSERT INTO candidat (nom, parti, age, photo, election_id, liste_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, parti || null, age || null, photo || null, electionId, liste_id || null]
    );

    res.status(201).json({
      message: "Candidat ajouté",
      id_candidat: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= MODIFIER UN CANDIDAT =================
export const updateCandidat = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, parti, age, photo, liste_id } = req.body;

    const [rows] = await pool.execute(
      `SELECT c.id_candidat, e.statut, e.admin_id
       FROM candidat c
       JOIN election e ON c.election_id = e.id_election
       WHERE c.id_candidat = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Candidat introuvable" });
    }

    if (rows[0].admin_id !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (rows[0].statut === "TERMINEE" || rows[0].statut === "EN_COURS") {
      return res.status(403).json({ message: "Impossible de modifier un candidat pendant ou après l'élection" });
    }

    await pool.execute(
      `UPDATE candidat SET nom=?, parti=?, age=?, photo=?, liste_id=? WHERE id_candidat=?`,
      [nom, parti || null, age || null, photo || null, liste_id || null, id]
    );

    res.json({ message: "Candidat modifié" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SUPPRIMER UN CANDIDAT =================
export const deleteCandidat = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.id_candidat, e.statut, e.admin_id
       FROM candidat c
       JOIN election e ON c.election_id = e.id_election
       WHERE c.id_candidat = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Candidat introuvable" });
    }

    if (rows[0].admin_id !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (rows[0].statut === "EN_COURS" || rows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible de supprimer un candidat pendant ou après l'élection" });
    }

    await pool.execute(`DELETE FROM candidat WHERE id_candidat = ?`, [id]);

    res.json({ message: "Candidat supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= IMPORT CSV CANDIDATS =================
export const importCandidatsCSV = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { candidats } = req.body; // tableau d'objets { nom, parti, age, liste? }

    if (!Array.isArray(candidats) || candidats.length === 0) {
      return res.status(400).json({ message: "Aucun candidat à importer" });
    }

    // Vérifier l'élection
    const adminId = req.user.id;
    const [elecRows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });
    }

    if (elecRows[0].statut === "TERMINEE" || elecRows[0].statut === "EN_COURS") {
      return res.status(403).json({ message: "Impossible d'importer des candidats à ce stade" });
    }

    // Vérifier le type de scrutin
    const [scrutinRows] = await pool.execute(
      `SELECT type FROM scrutin WHERE election_id = ?`,
      [electionId]
    );
    const typeScrutin = scrutinRows[0]?.type;

    let inserted = 0;
    const errors = [];

    for (const c of candidats) {
      try {
        let listeId = null;

        // Si scrutin LISTE, créer ou récupérer la liste
        if (typeScrutin === "LISTE" && c.liste) {
          const [listeRows] = await pool.execute(
            `SELECT id_liste FROM liste WHERE nom = ? AND election_id = ?`,
            [c.liste.trim(), electionId]
          );

          if (listeRows.length > 0) {
            listeId = listeRows[0].id_liste;
          } else {
            const [listeResult] = await pool.execute(
              `INSERT INTO liste (nom, election_id) VALUES (?, ?)`,
              [c.liste.trim(), electionId]
            );
            listeId = listeResult.insertId;
          }
        }

        await pool.execute(
          `INSERT INTO candidat (nom, parti, age, election_id, liste_id) VALUES (?, ?, ?, ?, ?)`,
          [c.nom.trim(), c.parti || null, c.age || null, electionId, listeId]
        );

        inserted++;
      } catch (err) {
        errors.push({ candidat: c.nom, erreur: err.message });
      }
    }

    res.status(201).json({
      message: `${inserted} candidat(s) importé(s)`,
      inserted,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= LISTER LES LISTES D'UNE ELECTION =================
export const getListesByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const [listes] = await pool.execute(
      `SELECT l.id_liste, l.nom,
              GROUP_CONCAT(c.nom ORDER BY c.id_candidat SEPARATOR ', ') AS candidats,
              COUNT(c.id_candidat) AS nb_candidats
       FROM liste l
       LEFT JOIN candidat c ON c.liste_id = l.id_liste
       WHERE l.election_id = ?
       GROUP BY l.id_liste
       ORDER BY l.nom ASC`,
      [electionId]
    );

    res.json(listes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const deleteListe = async (req, res) => {
  try {
    const { listeId } = req.params;
    await pool.execute(`DELETE FROM candidat WHERE liste_id = ?`, [listeId]);
    await pool.execute(`DELETE FROM liste WHERE id_liste = ?`, [listeId]);
    res.json({ message: "Liste supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};