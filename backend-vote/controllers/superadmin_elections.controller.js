// backend/controllers/superadmin_elections.controller.js
import { pool } from "../config/db.js";

// ─── TOUTES LES ÉLECTIONS ────────────────────────────────────────────────────
export const getAllElections = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.description,
             e.date_debut, e.date_fin, e.statut,
             e.duree_tour_minutes, e.tour_courant, e.nb_sieges,
             e.admin_id,
             e.visibilite,        
             e.photo_url,  
             s.type,
             u.nom AS nom_admin, u.prenom AS prenom_admin, u.email AS email_admin
      FROM election e
      JOIN scrutin s          ON e.id_election = s.election_id
      LEFT JOIN utilisateur u ON e.admin_id    = u.id
      ORDER BY e.date_debut DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CRÉER UNE ÉLECTION (super admin) ────────────────────────────────────────
export const createElectionSuperAdmin = async (req, res) => {
  try {
    const {
      titre, description, type,
      date_debut, date_fin,
      duree_tour_minutes, nb_sieges,
      admin_id, statut = "APPROUVEE",
    } = req.body;

    if (!titre || !type || !date_debut || !admin_id)
      return res.status(400).json({ error: "Champs obligatoires manquants." });

    const isListe = type === "LISTE";

    if (!isListe && !date_fin)
      return res.status(400).json({ error: "La date de fin est obligatoire." });

    let dateFin = date_fin;
    if (isListe) {
      const duree = parseInt(duree_tour_minutes) || 1440;
      dateFin = new Date(new Date(date_debut).getTime() + duree * 60000)
        .toISOString().slice(0, 19).replace("T", " ");
    }

    const [result] = await pool.execute(
      `INSERT INTO election
         (titre, description, date_debut, date_fin, statut, admin_id, duree_tour_minutes, nb_sieges)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre,
        description || "",
        date_debut,
        dateFin,
        statut,
        admin_id,
        isListe ? (parseInt(duree_tour_minutes) || 1440) : null,
        isListe ? (parseInt(nb_sieges)          || 29)   : null,
      ]
    );

    const election_id = result.insertId;

    await pool.execute(
      `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
      [type, election_id]
    );

    // Promouvoir l'admin si son rôle est encore PENDING
    await pool.execute(
      `UPDATE utilisateur SET role = 'ADMIN_ELECTION'
       WHERE id = ? AND role = 'ADMIN_ELECTION_PENDING'`,
      [admin_id]
    );

    res.status(201).json({ message: "Élection créée", election_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── MODIFIER UNE ÉLECTION (super admin) ─────────────────────────────────────
export const updateElectionSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre, description, type,
      date_debut, date_fin,
      duree_tour_minutes, nb_sieges,
      admin_id, statut,
    } = req.body;

    const isListe = type === "LISTE";

    let dateFin = date_fin;
    if (isListe && duree_tour_minutes) {
      const duree = parseInt(duree_tour_minutes);
      dateFin = new Date(new Date(date_debut).getTime() + duree * 60000)
        .toISOString().slice(0, 19).replace("T", " ");
    }

    await pool.execute(
      `UPDATE election
       SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
           statut = ?, admin_id = ?, duree_tour_minutes = ?, nb_sieges = ?
       WHERE id_election = ?`,
      [
        titre,
        description || "",
        date_debut,
        dateFin,
        statut,
        admin_id,
        isListe ? parseInt(duree_tour_minutes) : null,
        isListe ? parseInt(nb_sieges)          : null,
        id,
      ]
    );

    await pool.execute(
      `UPDATE scrutin SET type = ? WHERE election_id = ?`,
      [type, id]
    );

    res.json({ message: "Élection modifiée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── SUPPRIMER UNE ÉLECTION (super admin — cascade complète) ─────────────────
export const deleteElectionSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM scrutin            WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM tour_election      WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM vote_tour          WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM siege_liste        WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM fusion_liste       WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM candidat           WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM electeur_election  WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM vote               WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM election           WHERE id_election = ?`, [id]);

    res.json({ message: "Élection supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CHANGER L'ADMIN D'UNE ÉLECTION ──────────────────────────────────────────
export const changeElectionAdmin = async (req, res) => {
  try {
    const { id }       = req.params;
    const { admin_id } = req.body;

    if (!admin_id)
      return res.status(400).json({ error: "admin_id obligatoire" });

    await pool.execute(
      `UPDATE election SET admin_id = ? WHERE id_election = ?`,
      [admin_id, id]
    );

    // Promouvoir si PENDING
    await pool.execute(
      `UPDATE utilisateur SET role = 'ADMIN_ELECTION'
       WHERE id = ? AND role = 'ADMIN_ELECTION_PENDING'`,
      [admin_id]
    );

    res.json({ message: "Admin de l'élection mis à jour" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
