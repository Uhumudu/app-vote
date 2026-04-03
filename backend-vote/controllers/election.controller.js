import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { sendElectionApprovedEmail, sendElectionRejectedEmail } from "../services/mailer.js";

// Helper
const toMySQL = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

// ---------------------------------------------------------------------------
// ROUTES PUBLIQUES (sans authentification)
// ---------------------------------------------------------------------------

// GET /api/elections/public
export const getElectionsPubliques = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        e.id_election, e.titre, e.description,
        e.date_debut, e.date_fin,
        e.statut, e.tour_courant, e.visibilite,
        e.frais_vote_xaf,
        s.type,
        COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
        COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
      FROM election e
      JOIN scrutin s                 ON s.election_id  = e.id_election
      LEFT JOIN candidat c           ON c.election_id  = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.visibilite = 'PUBLIQUE'
        AND e.statut IN ('APPROUVEE', 'EN_COURS', 'EN_ATTENTE')
      GROUP BY e.id_election
      ORDER BY e.date_debut DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error("Erreur getElectionsPubliques :", error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/elections/public/:id
export const getElectionPubliqueDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT
        e.id_election, e.titre, e.description,
        e.date_debut, e.date_fin,
        e.statut, e.tour_courant, e.visibilite,
        e.frais_vote_xaf,
        s.type,
        COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
        COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
      FROM election e
      JOIN scrutin s                 ON s.election_id  = e.id_election
      LEFT JOIN candidat c           ON c.election_id  = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
      GROUP BY e.id_election
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Election publique introuvable" });

    const [candidats] = await pool.execute(
      `SELECT id_candidat, nom, parti, photo, age
       FROM candidat WHERE election_id = ? ORDER BY nom ASC`,
      [id]
    );

    return res.json({ ...rows[0], candidats });
  } catch (error) {
    console.error("Erreur getElectionPubliqueDetail :", error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/elections/public/:id/candidature
export const postulerCandidatPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, motDePasse, parti, age, photo } = req.body;

    if (!nom || !email || !motDePasse)
      return res.status(400).json({ message: "Nom, email et mot de passe requis." });

    const [elecRows] = await pool.execute(
      `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`, [id]
    );

    if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIQUE")
      return res.status(404).json({ message: "Election publique introuvable." });

    if (["EN_COURS", "TERMINEE"].includes(elecRows[0].statut))
      return res.status(403).json({ message: "Les candidatures ne sont plus acceptees." });

    let userId;
    const [existing] = await pool.execute(
      `SELECT id FROM utilisateur WHERE email = ?`, [email]
    );

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const hashed = await bcrypt.hash(motDePasse, 10);
      const [result] = await pool.execute(
        `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
         VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
        [nom, prenom || "", email, hashed]
      );
      userId = result.insertId;
    }

    const nomComplet = `${nom}${prenom ? " " + prenom : ""}`.trim();

    const [dejaCandidat] = await pool.execute(
      `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
      [id, nomComplet]
    );

    if (dejaCandidat.length > 0)
      return res.status(409).json({ message: "Une candidature avec ce nom existe deja." });

    const [candidatResult] = await pool.execute(
      `INSERT INTO candidat (nom, parti, age, photo, election_id)
       VALUES (?, ?, ?, ?, ?)`,
      [nomComplet, parti || null, age || null, photo || null, id]
    );

    return res.status(201).json({
      message: "Candidature soumise avec succes.",
      candidatId: candidatResult.insertId,
    });
  } catch (error) {
    console.error("Erreur postulerCandidatPublic :", error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/elections/public/:id/voter
export const inscrireEtVoterPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, motDePasse, candidat_id } = req.body;

    if (!nom || !email || !motDePasse || !candidat_id)
      return res.status(400).json({ message: "Tous les champs sont requis." });

    const [elecRows] = await pool.execute(
      `SELECT e.id_election, e.statut, e.visibilite, s.type
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ?`,
      [id]
    );

    if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIQUE")
      return res.status(404).json({ message: "Election publique introuvable." });

    if (elecRows[0].statut !== "EN_COURS")
      return res.status(403).json({ message: "L'election n'est pas en cours de vote." });

    let userId;
    const [existing] = await pool.execute(
      `SELECT id FROM utilisateur WHERE email = ?`, [email]
    );

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const hashed = await bcrypt.hash(motDePasse, 10);
      const [result] = await pool.execute(
        `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
         VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
        [nom, prenom || "", email, hashed]
      );
      userId = result.insertId;
    }

    const [alreadyIn] = await pool.execute(
      `SELECT electeur_id, a_vote FROM electeur_election
       WHERE electeur_id = ? AND election_id = ?`,
      [userId, id]
    );

    if (alreadyIn.length > 0 && alreadyIn[0].a_vote)
      return res.status(403).json({ message: "Vous avez deja vote a cette election." });

    if (alreadyIn.length === 0) {
      await pool.execute(
        `INSERT INTO electeur_election (electeur_id, election_id, a_vote) VALUES (?, ?, 0)`,
        [userId, id]
      );
    }

    await pool.execute(
      `INSERT INTO vote (electeur_id, election_id, candidat_id) VALUES (?, ?, ?)`,
      [userId, id, candidat_id]
    );

    await pool.execute(
      `UPDATE electeur_election SET a_vote = 1
       WHERE electeur_id = ? AND election_id = ?`,
      [userId, id]
    );

    return res.json({ message: "Vote enregistre avec succes !" });
  } catch (error) {
    console.error("Erreur inscrireEtVoterPublic :", error);
    if (error.code === "ER_DUP_ENTRY")
      return res.status(403).json({ message: "Vous avez deja vote a cette election." });
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// SUPER ADMIN
// ---------------------------------------------------------------------------

// GET /api/elections/pending
export const getPendingElections = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
              e.statut, e.duree_tour_minutes, e.nb_sieges, e.visibilite,
              e.frais_vote_xaf,
              s.type,
              u.nom AS nom_admin, u.prenom AS prenom_admin
       FROM election e
       JOIN scrutin s     ON e.id_election = s.election_id
       JOIN utilisateur u ON e.admin_id    = u.id
       WHERE e.statut = 'EN_ATTENTE'
       ORDER BY e.date_debut ASC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erreur getPendingElections :", error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/elections/approve/:id
export const approveElectionAndPromoteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Election introuvable" });

    if (rows[0].statut !== "EN_ATTENTE")
      return res.status(400).json({ message: "Seules les elections en attente peuvent etre approuvees" });

    await pool.execute(
      `UPDATE election SET statut = 'APPROUVEE' WHERE id_election = ?`, [id]
    );

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

    sendElectionApprovedEmail({
      email, nom, prenom,
      titreElection: titre,
      dateDebut: new Date(date_debut).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    }).catch(err => console.error("Email approbation non envoye :", err));

    return res.json({ message: "Election approuvee et admin promu" });
  } catch (error) {
    console.error("Erreur approveElectionAndPromoteAdmin :", error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/elections/reject/:id
export const rejectElection = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT e.statut, e.titre, u.nom, u.prenom, u.email
       FROM election e
       JOIN utilisateur u ON e.admin_id = u.id
       WHERE e.id_election = ?`,
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Election introuvable" });

    await pool.execute(
      `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
    );

    const { titre, nom, prenom, email } = rows[0];

    sendElectionRejectedEmail({ email, nom, prenom, titreElection: titre })
      .catch(err => console.error("Email refus non envoye :", err));

    return res.json({ message: "Election refusee" });
  } catch (error) {
    console.error("Erreur rejectElection :", error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/elections/statut/:id
export const updateStatutElection = async (req, res) => {
  try {
    const { id }     = req.params;
    const { statut } = req.body;

    const STATUTS_VALIDES = ["EN_ATTENTE", "APPROUVEE", "EN_COURS", "TERMINEE", "SUSPENDUE"];

    if (!STATUTS_VALIDES.includes(statut))
      return res.status(400).json({ message: "Statut invalide." });

    const [rows] = await pool.execute(
      `SELECT id_election FROM election WHERE id_election = ?`, [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Election introuvable" });

    await pool.execute(
      `UPDATE election SET statut = ? WHERE id_election = ?`, [statut, id]
    );

    return res.json({ message: `Statut mis a jour : ${statut}` });
  } catch (error) {
    console.error("Erreur updateStatutElection :", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// ADMIN ELECTION (connecte)
// ---------------------------------------------------------------------------

// POST /api/elections/submit
export const submitElectionForValidation = async (req, res) => {
  try {
    const {
      titre, description, date_debut, date_fin,
      type, duree_tour_minutes, nb_sieges, visibilite,
      frais_vote_xaf,
    } = req.body;

    const admin_id = req.user.id;

    if (!titre || !date_debut)
      return res.status(400).json({ error: "Le titre et la date de debut sont obligatoires." });

    if (type === "LISTE" && !duree_tour_minutes)
      return res.status(400).json({ error: "La duree par tour est obligatoire pour un scrutin de liste." });

    if (type !== "LISTE" && !date_fin)
      return res.status(400).json({ error: "La date de fin est obligatoire." });

    // Valeurs acceptees : PUBLIQUE ou PRIVEE (enum base de donnees)
    const modeVisibilite = visibilite === "PUBLIQUE" ? "PUBLIQUE" : "PRIVEE";

    let dateFin = date_fin;
    if (type === "LISTE") {
      dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
    }

    const [result] = await pool.execute(
      `INSERT INTO election
         (titre, description, date_debut, date_fin, statut, admin_id,
          duree_tour_minutes, nb_sieges, visibilite, frais_vote_xaf)
       VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?, ?, ?)`,
      [
        titre, description || "", date_debut, dateFin, admin_id,
        type === "LISTE" ? parseInt(duree_tour_minutes) : null,
        type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
        modeVisibilite,
        modeVisibilite === "PUBLIQUE" ? (parseInt(frais_vote_xaf) || 500) : null,
      ]
    );

    const election_id = result.insertId;

    await pool.execute(
      `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
      [type, election_id]
    );

    return res.status(201).json({ message: "Election soumise pour validation", election_id });
  } catch (error) {
    console.error("Erreur submitElectionForValidation :", error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/elections/
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
              e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
              e.frais_vote_xaf,
              s.type
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.admin_id = ?
       ORDER BY e.date_debut DESC`,
      [admin_id]
    );

    return res.json(rows);
  } catch (error) {
    console.error("Erreur getAdminElections :", error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/elections/:id
export const getElectionById = async (req, res) => {
  try {
    const { id }   = req.params;
    const admin_id = req.user.id;
    const role     = req.user.role;

    const [rows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.description,
              e.date_debut, e.date_fin, e.statut,
              e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
              e.frais_vote_xaf, e.admin_id,
              s.type
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.id_election = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Election introuvable" });

    if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
      return res.status(403).json({ message: "Acces refuse" });

    return res.json(rows[0]);
  } catch (error) {
    console.error("Erreur getElectionById :", error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/elections/update/:id
export const updateElection = async (req, res) => {
  try {
    const { id }   = req.params;
    const admin_id = req.user.id;
    const role     = req.user.role;

    const [rows] = await pool.execute(
      `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Election introuvable" });

    if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
      return res.status(403).json({ message: "Acces refuse : vous n'etes pas le proprietaire de cette election" });

    if (rows[0].statut === "EN_COURS")
      return res.status(403).json({ message: "Impossible de modifier une election en cours" });

    if (rows[0].statut === "TERMINEE")
      return res.status(403).json({ message: "Impossible de modifier une election terminee" });

    const {
      titre, description, date_debut, date_fin,
      type, duree_tour_minutes, nb_sieges, visibilite,
      frais_vote_xaf,
    } = req.body;

    // Valeurs acceptees : PUBLIQUE ou PRIVEE (enum base de donnees)
    const modeVisibilite = visibilite === "PUBLIQUE" ? "PUBLIQUE" : "PRIVEE";

    let dateFin = date_fin;
    if (type === "LISTE" && duree_tour_minutes) {
      dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
    }

    await pool.execute(
      `UPDATE election
       SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
           duree_tour_minutes = ?, nb_sieges = ?,
           visibilite = ?, frais_vote_xaf = ?
       WHERE id_election = ?`,
      [
        titre, description || "", date_debut, dateFin,
        type === "LISTE" ? parseInt(duree_tour_minutes) : null,
        type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
        modeVisibilite,
        modeVisibilite === "PUBLIQUE" ? (parseInt(frais_vote_xaf) || 500) : null,
        id,
      ]
    );

    await pool.execute(
      `UPDATE scrutin SET type = ? WHERE election_id = ?`, [type, id]
    );

    return res.json({ message: "Election modifiee avec succes" });
  } catch (error) {
    console.error("Erreur updateElection :", error);
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/elections/delete/:id
export const deleteElection = async (req, res) => {
  try {
    const { id }   = req.params;
    const admin_id = req.user.id;
    const role     = req.user.role;

    const [rows] = await pool.execute(
      `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Election introuvable" });

    if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
      return res.status(403).json({ message: "Acces refuse : vous n'etes pas le proprietaire de cette election" });

    if (rows[0].statut === "EN_COURS")
      return res.status(403).json({ message: "Impossible de supprimer une election en cours" });

    if (rows[0].statut === "TERMINEE")
      return res.status(403).json({ message: "Impossible de supprimer une election terminee" });

    await pool.execute(`DELETE FROM scrutin           WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM tour_election     WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM vote_tour         WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM siege_liste       WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM fusion_liste      WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM electeur_election WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM vote              WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM candidat          WHERE election_id = ?`, [id]);
    await pool.execute(`DELETE FROM election          WHERE id_election = ?`, [id]);

    return res.json({ message: "Election supprimee avec succes" });
  } catch (error) {
    console.error("Erreur deleteElection :", error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/elections/results/:id
export const getElectionResults = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(v.id_vote) AS nb_votes
       FROM candidat c
       LEFT JOIN vote v ON c.id_candidat = v.candidat_id
       WHERE c.election_id = ?
       GROUP BY c.id_candidat
       ORDER BY nb_votes DESC`,
      [id]
    );

    return res.json(rows);
  } catch (error) {
    console.error("Erreur getElectionResults :", error);
    return res.status(500).json({ error: error.message });
  }
};











































// import bcrypt from "bcryptjs";
// import { pool } from "../config/db.js";
// import { sendElectionApprovedEmail, sendElectionRejectedEmail } from "../services/mailer.js";

// // ─── Helper ──────────────────────────────────────────────────────────────────
// const toMySQL = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

// // ─────────────────────────────────────────────────────────────────────────────
// // ROUTES PUBLIQUES (sans authentification)
// // ─────────────────────────────────────────────────────────────────────────────

// // GET /api/elections/public
// export const getElectionsPubliques = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         e.frais_vote_xaf,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s                 ON s.election_id  = e.id_election
//       LEFT JOIN candidat c           ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.visibilite = 'PUBLIC'
//         AND e.statut IN ('APPROUVEE', 'EN_COURS', 'EN_ATTENTE')
//       GROUP BY e.id_election
//       ORDER BY e.date_debut DESC
//     `);
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElectionsPubliques :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/public/:id
// export const getElectionPubliqueDetail = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         e.frais_vote_xaf,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s                 ON s.election_id  = e.id_election
//       LEFT JOIN candidat c           ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.id_election = ? AND e.visibilite = 'PUBLIC'
//       GROUP BY e.id_election
//     `, [id]);

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection publique introuvable" });

//     const [candidats] = await pool.execute(
//       `SELECT id_candidat, nom, parti, photo, age
//        FROM candidat WHERE election_id = ? ORDER BY nom ASC`,
//       [id]
//     );

//     return res.json({ ...rows[0], candidats });
//   } catch (error) {
//     console.error("Erreur getElectionPubliqueDetail :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // POST /api/elections/public/:id/candidature
// export const postulerCandidatPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, parti, age, photo } = req.body;

//     if (!nom || !email || !motDePasse)
//       return res.status(400).json({ message: "Nom, email et mot de passe requis." });

//     const [elecRows] = await pool.execute(
//       `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`, [id]
//     );

//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (["EN_COURS", "TERMINEE"].includes(elecRows[0].statut))
//       return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );

//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     const nomComplet = `${nom}${prenom ? " " + prenom : ""}`.trim();

//     const [dejaCandidat] = await pool.execute(
//       `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
//       [id, nomComplet]
//     );

//     if (dejaCandidat.length > 0)
//       return res.status(409).json({ message: "Une candidature avec ce nom existe déjà." });

//     const [candidatResult] = await pool.execute(
//       `INSERT INTO candidat (nom, parti, age, photo, election_id)
//        VALUES (?, ?, ?, ?, ?)`,
//       [nomComplet, parti || null, age || null, photo || null, id]
//     );

//     return res.status(201).json({
//       message: "Candidature soumise avec succès.",
//       candidatId: candidatResult.insertId,
//     });
//   } catch (error) {
//     console.error("Erreur postulerCandidatPublic :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // POST /api/elections/public/:id/voter
// export const inscrireEtVoterPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, candidat_id } = req.body;

//     if (!nom || !email || !motDePasse || !candidat_id)
//       return res.status(400).json({ message: "Tous les champs sont requis." });

//     const [elecRows] = await pool.execute(
//       `SELECT e.id_election, e.statut, e.visibilite, s.type
//        FROM election e
//        JOIN scrutin s ON s.election_id = e.id_election
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (elecRows[0].statut !== "EN_COURS")
//       return res.status(403).json({ message: "L'élection n'est pas en cours de vote." });

//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );

//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     const [alreadyIn] = await pool.execute(
//       `SELECT electeur_id, a_vote FROM electeur_election
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );

//     if (alreadyIn.length > 0 && alreadyIn[0].a_vote)
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });

//     if (alreadyIn.length === 0) {
//       await pool.execute(
//         `INSERT INTO electeur_election (electeur_id, election_id, a_vote) VALUES (?, ?, 0)`,
//         [userId, id]
//       );
//     }

//     await pool.execute(
//       `INSERT INTO vote (electeur_id, election_id, candidat_id) VALUES (?, ?, ?)`,
//       [userId, id, candidat_id]
//     );

//     await pool.execute(
//       `UPDATE electeur_election SET a_vote = 1
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );

//     return res.json({ message: "🎉 Vote enregistré avec succès !" });
//   } catch (error) {
//     console.error("Erreur inscrireEtVoterPublic :", error);
//     if (error.code === "ER_DUP_ENTRY")
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SUPER ADMIN
// // ─────────────────────────────────────────────────────────────────────────────

// // GET /api/elections/pending
// export const getPendingElections = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
//               e.statut, e.duree_tour_minutes, e.nb_sieges, e.visibilite,
//               e.frais_vote_xaf,
//               s.type,
//               u.nom AS nom_admin, u.prenom AS prenom_admin
//        FROM election e
//        JOIN scrutin s     ON e.id_election = s.election_id
//        JOIN utilisateur u ON e.admin_id    = u.id
//        WHERE e.statut = 'EN_ATTENTE'
//        ORDER BY e.date_debut ASC`
//     );
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getPendingElections :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/approve/:id
// export const approveElectionAndPromoteAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
//     );

//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (rows[0].statut !== "EN_ATTENTE")
//       return res.status(400).json({ message: "Seules les élections en attente peuvent être approuvées" });

//     await pool.execute(
//       `UPDATE election SET statut = 'APPROUVEE' WHERE id_election = ?`, [id]
//     );

//     const [elecRows] = await pool.execute(
//       `SELECT e.admin_id, e.titre, e.date_debut,
//               u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     const { admin_id, titre, date_debut, nom, prenom, email } = elecRows[0];

//     await pool.execute(
//       `UPDATE utilisateur SET role = 'ADMIN_ELECTION' WHERE id = ?`, [admin_id]
//     );

//     sendElectionApprovedEmail({
//       email, nom, prenom,
//       titreElection: titre,
//       dateDebut: new Date(date_debut).toLocaleString("fr-FR", {
//         day: "2-digit", month: "2-digit", year: "numeric",
//         hour: "2-digit", minute: "2-digit",
//       }),
//     }).catch(err => console.error("❌ Email approbation non envoyé :", err));

//     return res.json({ message: "Élection approuvée et admin promu" });
//   } catch (error) {
//     console.error("Erreur approveElectionAndPromoteAdmin :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/reject/:id
// export const rejectElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT e.statut, e.titre, u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     await pool.execute(
//       `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
//     );

//     const { titre, nom, prenom, email } = rows[0];

//     sendElectionRejectedEmail({ email, nom, prenom, titreElection: titre })
//       .catch(err => console.error("❌ Email refus non envoyé :", err));

//     return res.json({ message: "Élection refusée" });
//   } catch (error) {
//     console.error("Erreur rejectElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/statut/:id
// export const updateStatutElection = async (req, res) => {
//   try {
//     const { id }     = req.params;
//     const { statut } = req.body;

//     const STATUTS_VALIDES = ["EN_ATTENTE", "APPROUVEE", "EN_COURS", "TERMINEE", "SUSPENDUE"];

//     if (!STATUTS_VALIDES.includes(statut))
//       return res.status(400).json({ message: "Statut invalide." });

//     const [rows] = await pool.execute(
//       `SELECT id_election FROM election WHERE id_election = ?`, [id]
//     );

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     await pool.execute(
//       `UPDATE election SET statut = ? WHERE id_election = ?`, [statut, id]
//     );

//     return res.json({ message: `Statut mis à jour : ${statut}` });
//   } catch (error) {
//     console.error("Erreur updateStatutElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ADMIN ELECTION (connecté)
// // ─────────────────────────────────────────────────────────────────────────────

// // POST /api/elections/submit
// export const submitElectionForValidation = async (req, res) => {
//   try {
//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges, visibilite,
//       frais_vote_xaf,
//     } = req.body;

//     const admin_id = req.user.id;

//     if (!titre || !date_debut)
//       return res.status(400).json({ error: "Le titre et la date de début sont obligatoires." });

//     if (type === "LISTE" && !duree_tour_minutes)
//       return res.status(400).json({ error: "La durée par tour est obligatoire pour un scrutin de liste." });

//     if (type !== "LISTE" && !date_fin)
//       return res.status(400).json({ error: "La date de fin est obligatoire." });

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : "PRIVE";

//     let dateFin = date_fin;
//     if (type === "LISTE") {
//       dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
//     }

//     const [result] = await pool.execute(
//       `INSERT INTO election
//          (titre, description, date_debut, date_fin, statut, admin_id,
//           duree_tour_minutes, nb_sieges, visibilite, frais_vote_xaf)
//        VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?, ?, ?)`,
//       [
//         titre, description || "", date_debut, dateFin, admin_id,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//         modeVisibilite,
//         modeVisibilite === "PUBLIC" ? (parseInt(frais_vote_xaf) || 500) : null,
//       ]
//     );

//     const election_id = result.insertId;

//     await pool.execute(
//       `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//       [type, election_id]
//     );

//     return res.status(201).json({ message: "Élection soumise pour validation", election_id });
//   } catch (error) {
//     console.error("Erreur submitElectionForValidation :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/
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
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
//               e.frais_vote_xaf,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.admin_id = ?
//        ORDER BY e.date_debut DESC`,
//       [admin_id]
//     );

//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getAdminElections :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/:id
// export const getElectionById = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.description,
//               e.date_debut, e.date_fin, e.statut,
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
//               e.frais_vote_xaf, e.admin_id,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé" });

//     return res.json(rows[0]);
//   } catch (error) {
//     console.error("Erreur getElectionById :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/update/:id
// export const updateElection = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });

//     if (rows[0].statut === "EN_COURS")
//       return res.status(403).json({ message: "Impossible de modifier une élection en cours" });

//     if (rows[0].statut === "TERMINEE")
//       return res.status(403).json({ message: "Impossible de modifier une élection terminée" });

//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges, visibilite,
//       frais_vote_xaf,
//     } = req.body;

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : "PRIVE";

//     let dateFin = date_fin;
//     if (type === "LISTE" && duree_tour_minutes) {
//       dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
//     }

//     await pool.execute(
//       `UPDATE election
//        SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
//            duree_tour_minutes = ?, nb_sieges = ?,
//            visibilite = ?, frais_vote_xaf = ?
//        WHERE id_election = ?`,
//       [
//         titre, description || "", date_debut, dateFin,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//         modeVisibilite,
//         modeVisibilite === "PUBLIC" ? (parseInt(frais_vote_xaf) || 500) : null,
//         id,
//       ]
//     );

//     await pool.execute(
//       `UPDATE scrutin SET type = ? WHERE election_id = ?`, [type, id]
//     );

//     return res.json({ message: "Élection modifiée avec succès" });
//   } catch (error) {
//     console.error("Erreur updateElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // DELETE /api/elections/delete/:id
// export const deleteElection = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );

//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });

//     if (rows[0].statut === "EN_COURS")
//       return res.status(403).json({ message: "Impossible de supprimer une élection en cours" });

//     if (rows[0].statut === "TERMINEE")
//       return res.status(403).json({ message: "Impossible de supprimer une élection terminée" });

//     await pool.execute(`DELETE FROM scrutin           WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM tour_election     WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM vote_tour         WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM siege_liste       WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM fusion_liste      WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM electeur_election WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM vote              WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM candidat          WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM election          WHERE id_election = ?`, [id]);

//     return res.json({ message: "Élection supprimée avec succès" });
//   } catch (error) {
//     console.error("Erreur deleteElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/results/:id
// export const getElectionResults = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT c.*, COUNT(v.id_vote) AS nb_votes
//        FROM candidat c
//        LEFT JOIN vote v ON c.id_candidat = v.candidat_id
//        WHERE c.election_id = ?
//        GROUP BY c.id_candidat
//        ORDER BY nb_votes DESC`,
//       [id]
//     );

//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElectionResults :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };








































// // backend/controllers/election.controller.js
// import bcrypt from "bcryptjs";
// import { pool } from "../config/db.js";
// import { sendElectionApprovedEmail, sendElectionRejectedEmail } from "../services/mailer.js";

// // ─── Helper ──────────────────────────────────────────────────────────────────
// const toMySQL = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

// // ─────────────────────────────────────────────────────────────────────────────
// // ROUTES PUBLIQUES (sans authentification)
// // ─────────────────────────────────────────────────────────────────────────────

// // GET /api/elections/public
// export const getElectionsPubliques = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s                 ON s.election_id  = e.id_election
//       LEFT JOIN candidat c           ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.visibilite = 'PUBLIC'
//         AND e.statut IN ('APPROUVEE', 'EN_COURS', 'EN_ATTENTE')
//       GROUP BY e.id_election
//       ORDER BY e.date_debut DESC
//     `);
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElectionsPubliques :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/public/:id
// export const getElectionPubliqueDetail = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s                 ON s.election_id  = e.id_election
//       LEFT JOIN candidat c           ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.id_election = ? AND e.visibilite = 'PUBLIC'
//       GROUP BY e.id_election
//     `, [id]);

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection publique introuvable" });

//     const [candidats] = await pool.execute(
//       `SELECT id_candidat, nom, parti, photo, age
//        FROM candidat WHERE election_id = ? ORDER BY nom ASC`,
//       [id]
//     );

//     return res.json({ ...rows[0], candidats });
//   } catch (error) {
//     console.error("Erreur getElectionPubliqueDetail :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // POST /api/elections/public/:id/candidature
// export const postulerCandidatPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, parti, age, photo } = req.body;

//     if (!nom || !email || !motDePasse)
//       return res.status(400).json({ message: "Nom, email et mot de passe requis." });

//     const [elecRows] = await pool.execute(
//       `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`, [id]
//     );
//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (["EN_COURS", "TERMINEE"].includes(elecRows[0].statut))
//       return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );
//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     const nomComplet = `${nom}${prenom ? " " + prenom : ""}`.trim();
//     const [dejaCandidat] = await pool.execute(
//       `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
//       [id, nomComplet]
//     );
//     if (dejaCandidat.length > 0)
//       return res.status(409).json({ message: "Une candidature avec ce nom existe déjà." });

//     const [candidatResult] = await pool.execute(
//       `INSERT INTO candidat (nom, parti, age, photo, election_id)
//        VALUES (?, ?, ?, ?, ?)`,
//       [nomComplet, parti || null, age || null, photo || null, id]
//     );

//     return res.status(201).json({
//       message: "Candidature soumise avec succès.",
//       candidatId: candidatResult.insertId,
//     });
//   } catch (error) {
//     console.error("Erreur postulerCandidatPublic :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // POST /api/elections/public/:id/voter
// export const inscrireEtVoterPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, candidat_id } = req.body;

//     if (!nom || !email || !motDePasse || !candidat_id)
//       return res.status(400).json({ message: "Tous les champs sont requis." });

//     const [elecRows] = await pool.execute(
//       `SELECT e.id_election, e.statut, e.visibilite, s.type
//        FROM election e
//        JOIN scrutin s ON s.election_id = e.id_election
//        WHERE e.id_election = ?`,
//       [id]
//     );
//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (elecRows[0].statut !== "EN_COURS")
//       return res.status(403).json({ message: "L'élection n'est pas en cours de vote." });

//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );
//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     const [alreadyIn] = await pool.execute(
//       `SELECT electeur_id, a_vote FROM electeur_election
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );
//     if (alreadyIn.length > 0 && alreadyIn[0].a_vote)
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });

//     if (alreadyIn.length === 0) {
//       await pool.execute(
//         `INSERT INTO electeur_election (electeur_id, election_id, a_vote) VALUES (?, ?, 0)`,
//         [userId, id]
//       );
//     }

//     await pool.execute(
//       `INSERT INTO vote (electeur_id, election_id, candidat_id) VALUES (?, ?, ?)`,
//       [userId, id, candidat_id]
//     );

//     await pool.execute(
//       `UPDATE electeur_election SET a_vote = 1
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );

//     return res.json({ message: "🎉 Vote enregistré avec succès !" });
//   } catch (error) {
//     console.error("Erreur inscrireEtVoterPublic :", error);
//     if (error.code === "ER_DUP_ENTRY")
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SUPER ADMIN
// // ─────────────────────────────────────────────────────────────────────────────

// // GET /api/elections/pending
// export const getPendingElections = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.date_debut, e.date_fin,
//               e.statut, e.duree_tour_minutes, e.nb_sieges, e.visibilite,
//               s.type,
//               u.nom AS nom_admin, u.prenom AS prenom_admin
//        FROM election e
//        JOIN scrutin s     ON e.id_election = s.election_id
//        JOIN utilisateur u ON e.admin_id    = u.id
//        WHERE e.statut = 'EN_ATTENTE'
//        ORDER BY e.date_debut ASC`
//     );
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getPendingElections :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/approve/:id
// export const approveElectionAndPromoteAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
//     );
//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (rows[0].statut !== "EN_ATTENTE")
//       return res.status(400).json({ message: "Seules les élections en attente peuvent être approuvées" });

//     await pool.execute(
//       `UPDATE election SET statut = 'APPROUVEE' WHERE id_election = ?`, [id]
//     );

//     const [elecRows] = await pool.execute(
//       `SELECT e.admin_id, e.titre, e.date_debut,
//               u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     const { admin_id, titre, date_debut, nom, prenom, email } = elecRows[0];

//     await pool.execute(
//       `UPDATE utilisateur SET role = 'ADMIN_ELECTION' WHERE id = ?`, [admin_id]
//     );

//     sendElectionApprovedEmail({
//       email, nom, prenom,
//       titreElection: titre,
//       dateDebut: new Date(date_debut).toLocaleString("fr-FR", {
//         day: "2-digit", month: "2-digit", year: "numeric",
//         hour: "2-digit", minute: "2-digit",
//       }),
//     }).catch(err => console.error("❌ Email approbation non envoyé :", err));

//     return res.json({ message: "Élection approuvée et admin promu" });
//   } catch (error) {
//     console.error("Erreur approveElectionAndPromoteAdmin :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/reject/:id
// export const rejectElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(
//       `SELECT e.statut, e.titre, u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );
//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     await pool.execute(
//       `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
//     );

//     const { titre, nom, prenom, email } = rows[0];

//     sendElectionRejectedEmail({ email, nom, prenom, titreElection: titre })
//       .catch(err => console.error("❌ Email refus non envoyé :", err));

//     return res.json({ message: "Élection refusée" });
//   } catch (error) {
//     console.error("Erreur rejectElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/statut/:id
// export const updateStatutElection = async (req, res) => {
//   try {
//     const { id }     = req.params;
//     const { statut } = req.body;

//     const STATUTS_VALIDES = ["EN_ATTENTE", "APPROUVEE", "EN_COURS", "TERMINEE", "SUSPENDUE"];
//     if (!STATUTS_VALIDES.includes(statut))
//       return res.status(400).json({ message: "Statut invalide." });

//     const [rows] = await pool.execute(
//       `SELECT id_election FROM election WHERE id_election = ?`, [id]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     await pool.execute(
//       `UPDATE election SET statut = ? WHERE id_election = ?`, [statut, id]
//     );

//     return res.json({ message: `Statut mis à jour : ${statut}` });
//   } catch (error) {
//     console.error("Erreur updateStatutElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ADMIN ELECTION (connecté)
// // ─────────────────────────────────────────────────────────────────────────────

// // POST /api/elections/submit
// export const submitElectionForValidation = async (req, res) => {
//   try {
//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges, visibilite,
//     } = req.body;
//     const admin_id = req.user.id;

//     if (!titre || !date_debut)
//       return res.status(400).json({ error: "Le titre et la date de début sont obligatoires." });

//     if (type === "LISTE" && !duree_tour_minutes)
//       return res.status(400).json({ error: "La durée par tour est obligatoire pour un scrutin de liste." });

//     if (type !== "LISTE" && !date_fin)
//       return res.status(400).json({ error: "La date de fin est obligatoire." });

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : "PRIVE";

//     let dateFin = date_fin;
//     if (type === "LISTE") {
//       dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
//     }

//     const [result] = await pool.execute(
//       `INSERT INTO election
//          (titre, description, date_debut, date_fin, statut, admin_id,
//           duree_tour_minutes, nb_sieges, visibilite)
//        VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?, ?)`,
//       [
//         titre, description || "", date_debut, dateFin, admin_id,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//         modeVisibilite,
//       ]
//     );

//     const election_id = result.insertId;
//     await pool.execute(
//       `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//       [type, election_id]
//     );

//     return res.status(201).json({ message: "Élection soumise pour validation", election_id });
//   } catch (error) {
//     console.error("Erreur submitElectionForValidation :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/
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
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.admin_id = ?
//        ORDER BY e.date_debut DESC`,
//       [admin_id]
//     );

//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getAdminElections :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/:id
// export const getElectionById = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT e.id_election, e.titre, e.description,
//               e.date_debut, e.date_fin, e.statut,
//               e.duree_tour_minutes, e.tour_courant, e.nb_sieges, e.visibilite,
//               s.type
//        FROM election e
//        JOIN scrutin s ON e.id_election = s.election_id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé" });

//     return res.json(rows[0]);
//   } catch (error) {
//     console.error("Erreur getElectionById :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/elections/update/:id
// export const updateElection = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });

//     if (rows[0].statut === "EN_COURS")
//       return res.status(403).json({ message: "Impossible de modifier une élection en cours" });

//     if (rows[0].statut === "TERMINEE")
//       return res.status(403).json({ message: "Impossible de modifier une élection terminée" });

//     const {
//       titre, description, date_debut, date_fin,
//       type, duree_tour_minutes, nb_sieges, visibilite,
//     } = req.body;

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : "PRIVE";

//     let dateFin = date_fin;
//     if (type === "LISTE" && duree_tour_minutes) {
//       dateFin = toMySQL(new Date(new Date(date_debut).getTime() + parseInt(duree_tour_minutes) * 60000));
//     }

//     await pool.execute(
//       `UPDATE election
//        SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
//            duree_tour_minutes = ?, nb_sieges = ?, visibilite = ?
//        WHERE id_election = ?`,
//       [
//         titre, description || "", date_debut, dateFin,
//         type === "LISTE" ? parseInt(duree_tour_minutes) : null,
//         type === "LISTE" ? (parseInt(nb_sieges) || 29) : null,
//         modeVisibilite, id,
//       ]
//     );

//     await pool.execute(
//       `UPDATE scrutin SET type = ? WHERE election_id = ?`, [type, id]
//     );

//     return res.json({ message: "Élection modifiée avec succès" });
//   } catch (error) {
//     console.error("Erreur updateElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // DELETE /api/elections/delete/:id
// export const deleteElection = async (req, res) => {
//   try {
//     const { id }   = req.params;
//     const admin_id = req.user.id;
//     const role     = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );
//     if (!rows.length)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && Number(rows[0].admin_id) !== Number(admin_id))
//       return res.status(403).json({ message: "Accès refusé : vous n'êtes pas le propriétaire de cette élection" });

//     if (rows[0].statut === "EN_COURS")
//       return res.status(403).json({ message: "Impossible de supprimer une élection en cours" });

//     if (rows[0].statut === "TERMINEE")
//       return res.status(403).json({ message: "Impossible de supprimer une élection terminée" });

//     await pool.execute(`DELETE FROM scrutin           WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM tour_election     WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM vote_tour         WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM siege_liste       WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM fusion_liste      WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM electeur_election WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM vote              WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM candidat          WHERE election_id = ?`, [id]);
//     await pool.execute(`DELETE FROM election          WHERE id_election = ?`, [id]);

//     return res.json({ message: "Élection supprimée avec succès" });
//   } catch (error) {
//     console.error("Erreur deleteElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/elections/results/:id
// export const getElectionResults = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(
//       `SELECT c.*, COUNT(v.id_vote) AS nb_votes
//        FROM candidat c
//        LEFT JOIN vote v ON c.id_candidat = v.candidat_id
//        WHERE c.election_id = ?
//        GROUP BY c.id_candidat
//        ORDER BY nb_votes DESC`,
//       [id]
//     );
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElectionResults :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };


































// // backend/controllers/election.controller.js
// import { pool } from "../config/db.js";

// // ================================
// // 📋 LISTER LES ÉLECTIONS (admin connecté)
// // ================================
// export const getElections = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const role    = req.user.role;

//     // SUPER_ADMIN voit toutes les élections ; ADMIN_ELECTION ne voit que les siennes
//     let query, params;

//     if (role === "SUPER_ADMIN") {
//       query = `
//         SELECT e.*, s.type AS type_scrutin,
//                u.nom AS admin_nom, u.prenom AS admin_prenom
//         FROM election e
//         JOIN scrutin s    ON s.election_id = e.id_election
//         JOIN utilisateur u ON u.id = e.admin_id
//         ORDER BY e.date_debut DESC
//       `;
//       params = [];
//     } else {
//       query = `
//         SELECT e.*, s.type AS type_scrutin
//         FROM election e
//         JOIN scrutin s ON s.election_id = e.id_election
//         WHERE e.admin_id = ?
//         ORDER BY e.date_debut DESC
//       `;
//       params = [adminId];
//     }

//     const [rows] = await pool.execute(query, params);
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElections :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🔍 DÉTAIL D'UNE ÉLECTION
// // ================================
// export const getElectionById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const adminId = req.user.id;
//     const role    = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT e.*, s.type AS type_scrutin
//        FROM election e
//        JOIN scrutin s ON s.election_id = e.id_election
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     // ADMIN_ELECTION ne peut voir que ses propres élections
//     if (role !== "SUPER_ADMIN" && rows[0].admin_id !== adminId)
//       return res.status(403).json({ message: "Accès refusé" });

//     return res.json(rows[0]);
//   } catch (error) {
//     console.error("Erreur getElectionById :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // ➕ CRÉER UNE ÉLECTION (depuis le dashboard admin)
// // ================================
// export const createElection = async (req, res) => {
//   try {
//     const adminId = req.user.id;
//     const {
//       titre, description, type,
//       startDate, endDate,
//       dureeTourMinutes, nbSieges,
//       visibilite, // ← NOUVEAU
//     } = req.body;

//     if (!titre || !type || !startDate)
//       return res.status(400).json({ message: "Titre, type et date de début obligatoires." });

//     const isListe = type === "LISTE";

//     if (!isListe && !endDate)
//       return res.status(400).json({ message: "La date de fin est obligatoire." });

//     const toMySQL = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

//     const start = toMySQL(startDate);
//     const duree = parseInt(dureeTourMinutes) || 1440;
//     const siege = parseInt(nbSieges) || 0;

//     const end = isListe
//       ? toMySQL(new Date(new Date(startDate).getTime() + duree * 60000))
//       : toMySQL(endDate);

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : "PRIVE";

//     // ── Insérer l'élection ────────────────────────────────────────────────
//     const [electionResult] = await pool.execute(
//       `INSERT INTO election
//          (titre, description, date_debut, date_fin, statut, admin_id,
//           duree_tour_minutes, nb_sieges, visibilite)
//        VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?, ?, ?)`,
//       [
//         titre,
//         description || "",
//         start,
//         end,
//         adminId,
//         isListe ? duree : null,
//         isListe ? siege : null,
//         modeVisibilite,
//       ]
//     );
//     const electionId = electionResult.insertId;

//     // ── Insérer le scrutin ────────────────────────────────────────────────
//     await pool.execute(
//       `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//       [type, electionId]
//     );

//     return res.status(201).json({
//       message: "Élection créée avec succès",
//       electionId,
//       visibilite: modeVisibilite,
//     });
//   } catch (error) {
//     console.error("Erreur createElection :", error);
//     return res.status(500).json({ error: error.sqlMessage || error.message });
//   }
// };

// // ================================
// // ✏️ MODIFIER UNE ÉLECTION
// // ================================
// export const updateElection = async (req, res) => {
//   try {
//     const { id }  = req.params;
//     const adminId = req.user.id;
//     const role    = req.user.role;

//     const {
//       titre, description,
//       startDate, endDate,
//       dureeTourMinutes, nbSieges,
//       visibilite, // ← NOUVEAU
//     } = req.body;

//     // Vérifier existence + droits
//     const [rows] = await pool.execute(
//       `SELECT id_election, statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && rows[0].admin_id !== adminId)
//       return res.status(403).json({ message: "Accès refusé" });

//     if (["EN_COURS", "TERMINEE"].includes(rows[0].statut))
//       return res.status(403).json({ message: "Impossible de modifier une élection en cours ou terminée." });

//     const toMySQL = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");
//     const start   = toMySQL(startDate);
//     const end     = toMySQL(endDate);

//     const modeVisibilite = ["PRIVE", "PUBLIC"].includes(visibilite) ? visibilite : rows[0].visibilite || "PRIVE";

//     await pool.execute(
//       `UPDATE election
//        SET titre = ?, description = ?, date_debut = ?, date_fin = ?,
//            duree_tour_minutes = ?, nb_sieges = ?, visibilite = ?
//        WHERE id_election = ?`,
//       [
//         titre,
//         description || "",
//         start,
//         end,
//         dureeTourMinutes ? parseInt(dureeTourMinutes) : null,
//         nbSieges ? parseInt(nbSieges) : null,
//         modeVisibilite,
//         id,
//       ]
//     );

//     return res.json({ message: "Élection modifiée avec succès", visibilite: modeVisibilite });
//   } catch (error) {
//     console.error("Erreur updateElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🗑️ SUPPRIMER UNE ÉLECTION
// // ================================
// export const deleteElection = async (req, res) => {
//   try {
//     const { id }  = req.params;
//     const adminId = req.user.id;
//     const role    = req.user.role;

//     const [rows] = await pool.execute(
//       `SELECT id_election, statut, admin_id FROM election WHERE id_election = ?`, [id]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     if (role !== "SUPER_ADMIN" && rows[0].admin_id !== adminId)
//       return res.status(403).json({ message: "Accès refusé" });

//     if (rows[0].statut === "EN_COURS")
//       return res.status(403).json({ message: "Impossible de supprimer une élection en cours." });

//     await pool.execute(`DELETE FROM election WHERE id_election = ?`, [id]);

//     return res.json({ message: "Élection supprimée avec succès" });
//   } catch (error) {
//     console.error("Erreur deleteElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🔄 CHANGER LE STATUT (Super Admin)
// // ================================
// export const updateStatutElection = async (req, res) => {
//   try {
//     const { id }    = req.params;
//     const { statut } = req.body;

//     const STATUTS_VALIDES = ["EN_ATTENTE", "APPROUVEE", "EN_COURS", "TERMINEE", "SUSPENDUE"];
//     if (!STATUTS_VALIDES.includes(statut))
//       return res.status(400).json({ message: "Statut invalide." });

//     const [rows] = await pool.execute(
//       `SELECT id_election, statut FROM election WHERE id_election = ?`, [id]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection introuvable" });

//     await pool.execute(
//       `UPDATE election SET statut = ? WHERE id_election = ?`, [statut, id]
//     );

//     return res.json({ message: `Statut mis à jour : ${statut}` });
//   } catch (error) {
//     console.error("Erreur updateStatutElection :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🌍 ÉLECTIONS PUBLIQUES (sans authentification)
// // ================================
// export const getElectionsPubliques = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s              ON s.election_id  = e.id_election
//       LEFT JOIN candidat c        ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.visibilite = 'PUBLIC'
//         AND e.statut IN ('APPROUVEE', 'EN_COURS', 'EN_ATTENTE')
//       GROUP BY e.id_election
//       ORDER BY e.date_debut DESC
//     `);
//     return res.json(rows);
//   } catch (error) {
//     console.error("Erreur getElectionsPubliques :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🔍 DÉTAIL ÉLECTION PUBLIQUE (sans authentification)
// // ================================
// export const getElectionPubliqueDetail = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election, e.titre, e.description,
//         e.date_debut, e.date_fin,
//         e.statut, e.tour_courant, e.visibilite,
//         s.type,
//         COUNT(DISTINCT c.id_candidat)  AS nb_candidats,
//         COUNT(DISTINCT ee.electeur_id) AS nb_electeurs
//       FROM election e
//       JOIN scrutin s              ON s.election_id  = e.id_election
//       LEFT JOIN candidat c        ON c.election_id  = e.id_election
//       LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
//       WHERE e.id_election = ? AND e.visibilite = 'PUBLIC'
//       GROUP BY e.id_election
//     `, [id]);

//     if (rows.length === 0)
//       return res.status(404).json({ message: "Élection publique introuvable" });

//     // Candidats de cette élection
//     const [candidats] = await pool.execute(
//       `SELECT id_candidat, nom, parti, photo, age, liste_id
//        FROM candidat
//        WHERE election_id = ?
//        ORDER BY nom ASC`,
//       [id]
//     );

//     return res.json({ ...rows[0], candidats });
//   } catch (error) {
//     console.error("Erreur getElectionPubliqueDetail :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // ✋ POSTULER COMME CANDIDAT (public, sans auth)
// // ================================
// export const postulerCandidatPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, parti, age, photo } = req.body;

//     if (!nom || !email || !motDePasse)
//       return res.status(400).json({ message: "Nom, email et mot de passe requis." });

//     // Vérifier que l'élection est publique et ouverte aux candidatures
//     const [elecRows] = await pool.execute(
//       `SELECT id_election, statut, visibilite, titre FROM election WHERE id_election = ?`,
//       [id]
//     );
//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     const { statut } = elecRows[0];
//     if (["EN_COURS", "TERMINEE"].includes(statut))
//       return res.status(403).json({ message: "Les candidatures ne sont plus acceptées pour cette élection." });

//     // Créer le compte si l'email n'existe pas encore
//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );
//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     // Vérifier si déjà candidat
//     const nomComplet = `${nom}${prenom ? " " + prenom : ""}`.trim();
//     const [dejaCandidat] = await pool.execute(
//       `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
//       [id, nomComplet]
//     );
//     if (dejaCandidat.length > 0)
//       return res.status(409).json({ message: "Une candidature avec ce nom existe déjà." });

//     // Insérer le candidat
//     const [candidatResult] = await pool.execute(
//       `INSERT INTO candidat (nom, parti, age, photo, election_id)
//        VALUES (?, ?, ?, ?, ?)`,
//       [nomComplet, parti || null, age || null, photo || null, id]
//     );

//     return res.status(201).json({
//       message: "Candidature soumise avec succès. Elle sera examinée par l'administrateur.",
//       candidatId: candidatResult.insertId,
//     });
//   } catch (error) {
//     console.error("Erreur postulerCandidatPublic :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================
// // 🗳️ S'INSCRIRE ET VOTER (public, sans auth)
// // ================================
// export const inscrireEtVoterPublic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, motDePasse, candidat_id } = req.body;

//     if (!nom || !email || !motDePasse || !candidat_id)
//       return res.status(400).json({ message: "Tous les champs sont requis." });

//     // Vérifier l'élection
//     const [elecRows] = await pool.execute(
//       `SELECT e.id_election, e.statut, e.visibilite, s.type
//        FROM election e
//        JOIN scrutin s ON s.election_id = e.id_election
//        WHERE e.id_election = ?`,
//       [id]
//     );
//     if (elecRows.length === 0 || elecRows[0].visibilite !== "PUBLIC")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (elecRows[0].statut !== "EN_COURS")
//       return res.status(403).json({ message: "L'élection n'est pas en cours de vote." });

//     // Créer ou récupérer l'utilisateur
//     let userId;
//     const [existing] = await pool.execute(
//       `SELECT id FROM utilisateur WHERE email = ?`, [email]
//     );
//     if (existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashed = await bcrypt.hash(motDePasse, 10);
//       const [result] = await pool.execute(
//         `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
//          VALUES (?, ?, ?, ?, 'ELECTEUR', 1)`,
//         [nom, prenom || "", email, hashed]
//       );
//       userId = result.insertId;
//     }

//     // Vérifier si déjà inscrit / déjà voté
//     const [alreadyIn] = await pool.execute(
//       `SELECT electeur_id, a_vote FROM electeur_election
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );

//     if (alreadyIn.length > 0 && alreadyIn[0].a_vote)
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });

//     // Inscrire l'électeur si pas encore inscrit
//     if (alreadyIn.length === 0) {
//       await pool.execute(
//         `INSERT INTO electeur_election (electeur_id, election_id, a_vote)
//          VALUES (?, ?, 0)`,
//         [userId, id]
//       );
//     }

//     // Enregistrer le vote
//     await pool.execute(
//       `INSERT INTO vote (electeur_id, election_id, candidat_id) VALUES (?, ?, ?)`,
//       [userId, id, candidat_id]
//     );

//     // Marquer comme ayant voté
//     await pool.execute(
//       `UPDATE electeur_election SET a_vote = 1
//        WHERE electeur_id = ? AND election_id = ?`,
//       [userId, id]
//     );

//     return res.json({ message: "🎉 Vote enregistré avec succès !" });
//   } catch (error) {
//     console.error("Erreur inscrireEtVoterPublic :", error);
//     if (error.code === "ER_DUP_ENTRY")
//       return res.status(403).json({ message: "Vous avez déjà voté à cette élection." });
//     return res.status(500).json({ error: error.message });
//   }
// };

// // Import bcrypt nécessaire pour les fonctions publiques
// import bcrypt from "bcryptjs";





































// // backend/controllers/election.controller.js
// import { pool } from "../config/db.js";
// import { sendElectionApprovedEmail, sendElectionRejectedEmail } from "../services/mailer.js";

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

//     // Récupère admin + infos élection en une seule requête
//     const [elecRows] = await pool.execute(
//       `SELECT e.admin_id, e.titre, e.date_debut,
//               u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     const { admin_id, titre, date_debut, nom, prenom, email } = elecRows[0];

//     await pool.execute(
//       `UPDATE utilisateur SET role = 'ADMIN_ELECTION' WHERE id = ?`, [admin_id]
//     );

//     // Envoi email de confirmation (non bloquant : ne fait pas échouer la réponse HTTP)
//     sendElectionApprovedEmail({
//       email,
//       nom,
//       prenom,
//       titreElection: titre,
//       dateDebut: new Date(date_debut).toLocaleString("fr-FR", {
//         day: "2-digit", month: "2-digit", year: "numeric",
//         hour: "2-digit", minute: "2-digit",
//       }),
//     }).catch(err => console.error("❌ Email approbation non envoyé :", err));

//     res.json({ message: "Élection approuvée et admin promu" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ─── REFUSER UNE ÉLECTION ────────────────────────────────────────────────────
// export const rejectElection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Récupère statut + infos créateur en une seule requête
//     const [rows] = await pool.execute(
//       `SELECT e.statut, e.titre,
//               u.nom, u.prenom, u.email
//        FROM election e
//        JOIN utilisateur u ON e.admin_id = u.id
//        WHERE e.id_election = ?`,
//       [id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "Élection introuvable" });
//     }

//     await pool.execute(
//       `UPDATE election SET statut = 'SUSPENDUE' WHERE id_election = ?`, [id]
//     );

//     const { titre, nom, prenom, email } = rows[0];

//     // Envoi email de refus (non bloquant : ne fait pas échouer la réponse HTTP)
//     sendElectionRejectedEmail({
//       email,
//       nom,
//       prenom,
//       titreElection: titre,
//     }).catch(err => console.error("❌ Email refus non envoyé :", err));

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














