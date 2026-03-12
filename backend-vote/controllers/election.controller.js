// src/controllers/election.controller.js

import { pool } from "../config/db.js";

// ================= ADMIN =================

// Créer une élection
export const submitElectionForValidation = async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin, type } = req.body;
    const admin_id = req.user.id;

    const [result] = await pool.execute(
      `INSERT INTO election (titre, description, date_debut, date_fin, statut, admin_id)
       VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?)`,
      [titre, description, date_debut, date_fin, admin_id]
    );

    const election_id = result.insertId;

    await pool.execute(
      `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
      [type, election_id]
    );

    res.status(201).json({
      message: "Élection soumise pour validation",
      election_id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= MODIFIER ELECTION =================

// Récupérer une élection par ID
export const getElectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.description, e.date_debut, e.date_fin, e.statut, s.type
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      WHERE e.id_election = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une élection
export const updateElection = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier le statut
    const [rows] = await pool.execute(
      `SELECT statut FROM election WHERE id_election=?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    if (rows[0].statut === "EN_COURS" || rows[0].statut === "TERMINEE") {
      return res.status(403).json({
        message: "Impossible de modifier une élection déjà commencée"
      });
    }

    const { titre, description, date_debut, date_fin, type } = req.body;

    await pool.execute(
      `UPDATE election
       SET titre=?, description=?, date_debut=?, date_fin=?
       WHERE id_election=?`,
      [titre, description, date_debut, date_fin, id]
    );

    await pool.execute(
      `UPDATE scrutin SET type=? WHERE election_id=?`,
      [type, id]
    );

    res.json({ message: "Élection modifiée" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SUPPRIMER ELECTION =================
export const deleteElection = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT statut FROM election WHERE id_election=?`,
      [id]
    );

    if (rows[0].statut === "EN_COURS") {
      return res.status(403).json({
        message: "Impossible de supprimer une élection en cours"
      });
    }

    await pool.execute(`DELETE FROM scrutin WHERE election_id=?`, [id]);
    await pool.execute(`DELETE FROM election WHERE id_election=?`, [id]);

    res.json({ message: "Élection supprimée" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= RECUPERER LES ELECTIONS =================
export const getAdminElections = async (req, res) => {
  try {
    const admin_id = req.user.id;

    // 🔹 Mettre EN_COURS automatiquement
    await pool.execute(`
      UPDATE election
      SET statut='EN_COURS'
      WHERE statut='APPROUVEE'
      AND date_debut <= NOW()
    `);

    // 🔹 Mettre TERMINEE automatiquement
    await pool.execute(`
      UPDATE election
      SET statut='TERMINEE'
      WHERE statut='EN_COURS'
      AND date_fin <= NOW()
    `);

    const [rows] = await pool.execute(`
      SELECT e.id_election,
             e.titre,
             e.date_debut,
             e.date_fin,
             e.statut,
             s.type
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      WHERE e.admin_id = ?
      ORDER BY e.date_debut DESC
    `, [admin_id]);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SUPER ADMIN =================
export const approveElectionAndPromoteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      `UPDATE election SET statut='APPROUVEE' WHERE id_election=?`,
      [id]
    );

    const [rows] = await pool.execute(
      `SELECT admin_id FROM election WHERE id_election=?`,
      [id]
    );

    const adminId = rows[0].admin_id;

    await pool.execute(
      `UPDATE utilisateur SET role='ADMIN_ELECTION' WHERE id=?`,
      [adminId]
    );

    res.json({ message: "Élection approuvée et admin promu" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= REFUSER =================
export const rejectElection = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      `UPDATE election SET statut='SUSPENDUE' WHERE id_election=?`,
      [id]
    );

    res.json({ message: "Élection refusée" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= RESULTATS =================
export const getElectionResults = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT c.*, COUNT(v.id_vote) AS nb_votes
      FROM candidat c
      LEFT JOIN vote v ON c.id_candidat = v.candidat_id
      WHERE c.election_id = ?
      GROUP BY c.id_candidat
    `, [id]);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= ELECTIONS EN ATTENTE =================
export const getPendingElections = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.id_election,
             e.titre,
             e.date_debut,
             e.date_fin,
             e.statut,
             s.type,
             u.nom AS nom_admin,
             u.prenom AS prenom_admin
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      JOIN utilisateur u ON e.admin_id = u.id
      WHERE e.statut = 'EN_ATTENTE'
      ORDER BY e.date_debut ASC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

