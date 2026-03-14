// backend/controllers/liste.controller.js
import { pool } from "../config/db.js";

// ================= CRÉER UNE LISTE (ADMIN) =================
export const creerListe = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { nom }        = req.body;
    const adminId        = req.user.id;

    if (!nom)
      return res.status(400).json({ message: "Le nom de la liste est obligatoire" });

    // Vérifier que l'élection appartient à cet admin
    const [elecRows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (!elecRows.length)
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });

    if (elecRows[0].statut === "TERMINEE")
      return res.status(403).json({ message: "Impossible d'ajouter une liste à une élection terminée" });

    // Créer la liste
    const [result] = await pool.execute(
      `INSERT INTO liste (nom, election_id) VALUES (?, ?)`,
      [nom, electionId]
    );

    const listeId = result.insertId;

    // ✅ Insérer automatiquement dans liste_tour comme qualifiée pour le tour 1
    await pool.execute(
      `INSERT IGNORE INTO liste_tour (election_id, liste_id, tour, statut)
       VALUES (?, ?, 1, 'qualifiee')`,
      [electionId, listeId]
    );

    res.status(201).json({
      message:  "Liste créée",
      id_liste: listeId,
      nom,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= LISTER LES LISTES D'UNE ELECTION (ADMIN) =================
export const getListes = async (req, res) => {
  try {
    const { electionId } = req.params;
    const adminId        = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (!elecRows.length)
      return res.status(403).json({ message: "Accès refusé" });

    const [rows] = await pool.execute(`
      SELECT l.id_liste, l.nom,
             COUNT(c.id_candidat) AS nb_candidats,
             lt.statut            AS statut_tour1
      FROM liste l
      LEFT JOIN candidat c  ON c.liste_id    = l.id_liste
      LEFT JOIN liste_tour lt ON lt.liste_id  = l.id_liste
                              AND lt.election_id = l.election_id
                              AND lt.tour = 1
      WHERE l.election_id = ?
      GROUP BY l.id_liste, l.nom, lt.statut
      ORDER BY l.nom ASC
    `, [electionId]);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= MODIFIER UNE LISTE (ADMIN) =================
export const modifierListe = async (req, res) => {
  try {
    const { electionId, listeId } = req.params;
    const { nom }                 = req.body;
    const adminId                 = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (!elecRows.length)
      return res.status(403).json({ message: "Accès refusé" });

    await pool.execute(
      `UPDATE liste SET nom = ? WHERE id_liste = ? AND election_id = ?`,
      [nom, listeId, electionId]
    );

    res.json({ message: "Liste modifiée" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SUPPRIMER UNE LISTE (ADMIN) =================
export const supprimerListe = async (req, res) => {
  try {
    const { electionId, listeId } = req.params;
    const adminId                 = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (!elecRows.length)
      return res.status(403).json({ message: "Accès refusé" });

    if (elecRows[0].statut === "EN_COURS")
      return res.status(403).json({ message: "Impossible de supprimer une liste pendant l'élection" });

    // Supprimer liste_tour + liste (cascade sur les candidats)
    await pool.execute(
      `DELETE FROM liste_tour WHERE liste_id = ? AND election_id = ?`,
      [listeId, electionId]
    );

    await pool.execute(
      `DELETE FROM liste WHERE id_liste = ? AND election_id = ?`,
      [listeId, electionId]
    );

    res.json({ message: "Liste supprimée" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};