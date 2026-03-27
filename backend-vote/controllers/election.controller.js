// backend/controllers/election.controller.js
import { pool } from "../config/db.js";
import { sendElectionApprovedEmail, sendElectionRejectedEmail } from "../services/mailer.js";

// ─── SOUMETTRE UNE ÉLECTION ──────────────────────────────────────────────────
export const submitElectionForValidation = async (req, res) => {
  try {
    const {
      titre, description, date_debut, date_fin,
      type, duree_tour_minutes, nb_sieges
    } = req.body;
    const admin_id = req.user.id;

    if (!titre || !date_debut) {
      return res.status(400).json({ error: "Le titre et la date de début sont obligatoires." });
    }

    if (type === "LISTE" && !duree_tour_minutes) {
      return res.status(400).json({ error: "La durée par tour est obligatoire pour un scrutin de liste." });
    }

    if (type !== "LISTE" && !date_fin) {
      return res.status(400).json({ error: "La date de fin est obligatoire." });
    }

    let dateFin = date_fin;
    if (type === "LISTE") {
      const debut = new Date(date_debut);
      dateFin = new Date(debut.getTime() + parseInt(duree_tour_minutes) * 60000)
        .toISOString().slice(0, 19).replace("T", " ");
    }

    const [result] = await pool.execute(
      `INSERT INTO election
         (titre, description, date_debut, date_fin, statut, admin_id, duree_tour_minutes, nb_sieges)
       VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?)`,
      [
        titre,
        description || "",
        date_debut,
        dateFin,
        admin_id,
        type === "LISTE" ? parseInt(duree_tour_minutes) : null,
        type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
      ]
    );

    const election_id = result.insertId;

    await pool.execute(
      `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
      [type, election_id]
    );

    res.status(201).json({ message: "Élection soumise pour validation", election_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── RÉCUPÉRER UNE ÉLECTION PAR ID ──────────────────────────────────────────
export const getElectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.description,
              e.date_debut, e.date_fin, e.statut,
              e.duree_tour_minutes, e.tour_courant, e.nb_sieges,
              s.type
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.id_election = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── METTRE À JOUR UNE ÉLECTION ──────────────────────────────────────────────
export const updateElection = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    // Bloque si élection en cours ou terminée
    if (rows[0].statut === "EN_COURS") {
      return res.status(403).json({ message: "Impossible de modifier une élection en cours" });
    }
    if (rows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible de modifier une élection terminée" });
    }

    // Vérifie que c'est bien l'admin propriétaire
    if (Number(rows[0].admin_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });
    }

    const {
      titre, description, date_debut, date_fin,
      type, duree_tour_minutes, nb_sieges
    } = req.body;

    let dateFin = date_fin;
    if (type === "LISTE" && duree_tour_minutes) {
      const debut = new Date(date_debut);
      dateFin = new Date(debut.getTime() + parseInt(duree_tour_minutes) * 60000)
        .toISOString().slice(0, 19).replace("T", " ");
    }

    await pool.execute(
      `UPDATE election
       SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
           duree_tour_minutes = ?, nb_sieges = ?
       WHERE id_election = ?`,
      [
        titre,
        description || "",
        date_debut,
        dateFin,
        type === "LISTE" ? parseInt(duree_tour_minutes) : null,
        type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
        id,
      ]
    );

    await pool.execute(
      `UPDATE scrutin SET type = ? WHERE election_id = ?`, [type, id]
    );

    res.json({ message: "Élection modifiée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── SUPPRIMER UNE ÉLECTION ──────────────────────────────────────────────────
export const deleteElection = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    // Vérifie que c'est bien l'admin propriétaire
    if (Number(rows[0].admin_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });
    }

    if (rows[0].statut === "EN_COURS") {
      return res.status(403).json({ message: "Impossible de supprimer une élection en cours" });
    }
    if (rows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible de supprimer une élection terminée" });
    }

    await pool.execute(`DELETE FROM scrutin         WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM tour_election   WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM vote_tour       WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM siege_liste     WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM fusion_liste    WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM election        WHERE id_election = ?`, [id]);

    res.json({ message: "Élection supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── RÉCUPÉRER LES ÉLECTIONS DE L'ADMIN ─────────────────────────────────────
export const getAdminElections = async (req, res) => {
  try {
    const admin_id = req.user.id;

    await pool.execute(`
      UPDATE election SET statut = 'EN_COURS'
      WHERE statut = 'APPROUVEE' AND date_debut <= NOW()
    `);

    await pool.execute(`
      UPDATE election e
      JOIN scrutin s ON s.election_id = e.id_election
      SET e.statut = 'TERMINEE'
      WHERE e.statut = 'EN_COURS' AND s.type != 'LISTE' AND e.date_fin <= NOW()
    `);

    const [rows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.date_debut, e.date_fin, e.statut,
              e.duree_tour_minutes, e.tour_courant, e.nb_sieges,
              s.type
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.admin_id = ?
       ORDER BY e.date_debut DESC`,
      [admin_id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── APPROUVER + PROMOUVOIR ADMIN ────────────────────────────────────────────
export const approveElectionAndPromoteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    if (rows[0].statut !== "EN_ATTENTE") {
      return res.status(400).json({ message: "Seules les élections en attente peuvent être approuvées" });
    }

    await pool.execute(
      `UPDATE election SET statut = 'APPROUVEE' WHERE id_election = ?`, [id]
    );

    // Récupère admin + infos élection en une seule requête
    const [elecRows] = await pool.execute(
      `SELECT e.admin_id, e.titre, e.date_debut,
              u.nom, u.prenom, u.email
       FROM election e
       JOIN utilisateur u ON e.admin_id = u.id
       WHERE e.id_election = ?`,
      [id]
    );

    const { admin_id, titre, date_debut, nom, prenom, email } = elecRows[0];

    await pool.execute(
      `UPDATE utilisateur SET role = 'ADMIN_ELECTION' WHERE id = ?`, [admin_id]
    );

    // Envoi email de confirmation (non bloquant : ne fait pas échouer la réponse HTTP)
    sendElectionApprovedEmail({
      email,
      nom,
      prenom,
      titreElection: titre,
      dateDebut: new Date(date_debut).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    }).catch(err => console.error("❌ Email approbation non envoyé :", err));

    res.json({ message: "Élection approuvée et admin promu" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── REFUSER UNE ÉLECTION ────────────────────────────────────────────────────
export const rejectElection = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupère statut + infos créateur en une seule requête
    const [rows] = await pool.execute(
      `SELECT e.statut, e.titre,
              u.nom, u.prenom, u.email
       FROM election e
       JOIN utilisateur u ON e.admin_id = u.id
       WHERE e.id_election = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    await pool.execute(
      `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
    );

    const { titre, nom, prenom, email } = rows[0];

    // Envoi email de refus (non bloquant : ne fait pas échouer la réponse HTTP)
    sendElectionRejectedEmail({
      email,
      nom,
      prenom,
      titreElection: titre,
    }).catch(err => console.error("❌ Email refus non envoyé :", err));

    res.json({ message: "Élection refusée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── RÉSULTATS SIMPLES ───────────────────────────────────────────────────────
export const getElectionResults = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(v.id_vote) AS nb_votes
       FROM candidat c
       LEFT JOIN vote v ON c.id_candidat = v.candidat_id
       WHERE c.election_id = ?
       GROUP BY c.id_candidat`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── ÉLECTIONS EN ATTENTE (super admin) ──────────────────────────────────────
export const getPendingElections = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.date_debut, e.date_fin, e.statut,
              e.duree_tour_minutes, e.nb_sieges,
              s.type,
              u.nom AS nom_admin, u.prenom AS prenom_admin
       FROM election e
       JOIN scrutin s     ON e.id_election = s.election_id
       JOIN utilisateur u ON e.admin_id    = u.id
       WHERE e.statut = 'EN_ATTENTE'
       ORDER BY e.date_debut ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};









































// // backend/controllers/election.controller.js
// import { pool } from "../config/db.js";

// // ─── SOUMETTRE UNE ÉLECTION ──────────────────────────────────────────────────
// export const submitElectionForValidation = async (req, res) => {
//   try {
//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges
//     } = req.body;
//     const admin_id = req.user.id;

//     if (!titre || !date_debut) {
//       return res.status(400).json({ error: "Le titre et la date de début sont obligatoires." });
//     }

//     if (type === "LISTE" && !duree_tour_minutes) {
//       return res.status(400).json({ error: "La durée par tour est obligatoire pour un scrutin de liste." });
//     }

//     if (type !== "LISTE" && !date_fin) {
//       return res.status(400).json({ error: "La date de fin est obligatoire." });
//     }

//     let dateFin = date_fin;
//     if (type === "LISTE") {
//       const debut = new Date(date_debut);
//       dateFin = new Date(debut.getTime() + parseInt(duree_tour_minutes) * 60000)
//         .toISOString().slice(0, 19).replace("T", " ");
//     }

//     const [result] = await pool.execute(
//       `INSERT INTO election
//          (titre, description, date_debut, date_fin, statut, admin_id, duree_tour_minutes, nb_sieges)
//        VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?)`,
//       [
//         titre,
//         description || "",
//         date_debut,
//         dateFin,
//         admin_id,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//       ]
//     );

//     const election_id = result.insertId;

//     await pool.execute(
//       `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//       [type, election_id]
//     );

//     res.status(201).json({ message: "Élection soumise pour validation", election_id });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── RÉCUPÉRER UNE ÉLECTION PAR ID ──────────────────────────────────────────
// export const getElectionById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.description,
//               e.date_debut, e.date_fin, e.statut,
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     res.json(rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── METTRE À JOUR UNE ÉLECTION ──────────────────────────────────────────────
// export const updateElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     // Bloque si élection en cours ou terminée
//     if (rows[0].statut === "EN_COURS") {
//       return res.status(403).json({ message: "Impossible de modifier une élection en cours" });
//     }
//     if (rows[0].statut === "TERMINEE") {
//       return res.status(403).json({ message: "Impossible de modifier une élection terminée" });
//     }

//     // Vérifie que c'est bien l'admin propriétaire
//     if (Number(rows[0].admin_id) !== Number(req.user.id)) {
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });
//     }

//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges
//     } = req.body;

//     let dateFin = date_fin;
//     if (type === "LISTE" && duree_tour_minutes) {
//       const debut = new Date(date_debut);
//       dateFin = new Date(debut.getTime() + parseInt(duree_tour_minutes) * 60000)
//         .toISOString().slice(0, 19).replace("T", " ");
//     }

//     await pool.execute(
//       `UPDATE election
//        SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
//            duree_tour_minutes = ?, nb_sieges = ?
//        WHERE id_election = ?`,
//       [
//         titre,
//         description || "",
//         date_debut,
//         dateFin,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//         id,
//       ]
//     );

//     await pool.execute(
//       `UPDATE scrutin SET type = ? WHERE election_id = ?`, [type, id]
//     );

//     res.json({ message: "Élection modifiée avec succès" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── SUPPRIMER UNE ÉLECTION ──────────────────────────────────────────────────
// export const deleteElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     // Vérifie que c'est bien l'admin propriétaire
//     if (Number(rows[0].admin_id) !== Number(req.user.id)) {
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });
//     }

//     if (rows[0].statut === "EN_COURS") {
//       return res.status(403).json({ message: "Impossible de supprimer une élection en cours" });
//     }
//     if (rows[0].statut === "TERMINEE") {
//       return res.status(403).json({ message: "Impossible de supprimer une élection terminée" });
//     }

//     await pool.execute(`DELETE FROM scrutin         WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM tour_election   WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM vote_tour       WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM siege_liste     WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM fusion_liste    WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM election        WHERE id_election = ?`, [id]);

//     res.json({ message: "Élection supprimée avec succès" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── RÉCUPÉRER LES ÉLECTIONS DE L'ADMIN ─────────────────────────────────────
// export const getAdminElections = async (req, res) => {
//   try {
//     const admin_id = req.user.id;

//     await pool.execute(`
//       UPDATE election SET statut = 'EN_COURS'
//       WHERE statut = 'APPROUVEE' AND date_debut <= NOW()
//     `);

//     await pool.execute(`
//       UPDATE election e
//       JOIN scrutin s ON s.election_id = e.id_election
//       SET e.statut = 'TERMINEE'
//       WHERE e.statut = 'EN_COURS' AND s.type != 'LISTE' AND e.date_fin <= NOW()
//     `);

//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.date_debut, e.date_fin, e.statut,
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.admin_id = ?
//        ORDER BY e.date_debut DESC`,
//       [admin_id]
//     );

//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── APPROUVER + PROMOUVOIR ADMIN ────────────────────────────────────────────
// export const approveElectionAndPromoteAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     if (rows[0].statut !== "EN_ATTENTE") {
//       return res.status(400).json({ message: "Seules les élections en attente peuvent être approuvées" });
//     }

//     await pool.execute(
//       `UPDATE election SET statut = 'APPROUVEE' WHERE id_election = ?`, [id]
//     );

//     const [elecRows] = await pool.execute(
//       `SELECT admin_id FROM election WHERE id_election = ?`, [id]
//     );

//     await pool.execute(
//       `UPDATE utilisateur SET role = 'ADMIN_ELECTION' WHERE id = ?`, [elecRows[0].admin_id]
//     );

//     res.json({ message: "Élection approuvée et admin promu" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── REFUSER UNE ÉLECTION ────────────────────────────────────────────────────
// export const rejectElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT statut FROM election WHERE id_election = ?`, [id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     await pool.execute(
//       `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
//     );

//     res.json({ message: "Élection refusée" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── RÉSULTATS SIMPLES ───────────────────────────────────────────────────────
// export const getElectionResults = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(
//       `SELECT c.*, COUNT(v.id_vote) AS nb_votes
//        FROM candidat c
//        LEFT JOIN vote v ON c.id_candidat = v.candidat_id
//        WHERE c.election_id = ?
//        GROUP BY c.id_candidat`,
//       [id]
//     );
//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── ÉLECTIONS EN ATTENTE (super admin) ──────────────────────────────────────
// export const getPendingElections = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.date_debut, e.date_fin, e.statut,
//               e.duree_tour_minutes, e.nb_sieges,
//               s.type,
//               u.nom AS nom_admin, u.prenom AS prenom_admin
//        FROM election e
//        JOIN scrutin s     ON e.id_election = s.election_id
//        JOIN utilisateur u ON e.admin_id    = u.id
//        WHERE e.statut = 'EN_ATTENTE'
//        ORDER BY e.date_debut ASC`
//     );
//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };














