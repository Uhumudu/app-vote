






// backend/controllers/electeur.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import { sendCredentialsEmail, sendVoteConfirmationEmail } from "../services/mailer.js";

// ================= LISTER LES ELECTEURS D'UNE ELECTION (ADMIN) =================
export const getElecteursByElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const adminId = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });
    }

    const [rows] = await pool.execute(`
      SELECT u.id, u.nom, u.prenom, u.email, u.actif,
             ee.a_vote
      FROM utilisateur u
      JOIN electeur_election ee ON u.id = ee.electeur_id
      WHERE ee.election_id = ?
      ORDER BY u.nom ASC, u.prenom ASC
    `, [electionId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= AJOUTER UN ELECTEUR (ADMIN) =================
export const addElecteur = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { nom, prenom, email, actif } = req.body;
    const adminId = req.user.id;

    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: "Nom, prénom et email sont obligatoires" });
    }

    const [elecRows] = await pool.execute(
      `SELECT id_election, statut, titre FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });
    }

    if (elecRows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible d'ajouter un électeur à une élection terminée" });
    }

    const titreElection = elecRows[0].titre;

    const rawPassword    = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let userId;

    const [existingUser] = await pool.execute(
      `SELECT id FROM utilisateur WHERE email = ?`,
      [email]
    );

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const [userResult] = await pool.execute(
        `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
         VALUES (?, ?, ?, ?, 'ELECTEUR', ?)`,
        [nom, prenom, email, hashedPassword, actif !== undefined ? actif : true]
      );
      userId = userResult.insertId;
    }

    const [alreadyIn] = await pool.execute(
      `SELECT electeur_id FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
      [userId, electionId]
    );

    if (alreadyIn.length > 0) {
      return res.status(409).json({ message: "Cet électeur est déjà inscrit à cette élection" });
    }

    await pool.execute(
      `INSERT INTO electeur_election (electeur_id, election_id, a_vote) VALUES (?, ?, 0)`,
      [userId, electionId]
    );

    try {
      await sendCredentialsEmail({ email, nom, prenom, motDePasse: rawPassword, titreElection });
    } catch (mailErr) {
      console.error("⚠️ Erreur envoi email :", mailErr.message);
    }

    res.status(201).json({
      message:      "Électeur ajouté",
      userId,
      mot_de_passe: rawPassword,
      emailEnvoye:  true,
    });
  } catch (error) {
    res.status(500).json({ error: error.sqlMessage || error.message });
  }
};

// ================= MODIFIER UN ELECTEUR (ADMIN) =================
export const updateElecteur = async (req, res) => {
  try {
    const { electionId, electeurId } = req.params;
    const { nom, prenom, email, actif } = req.body;
    const adminId = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const [link] = await pool.execute(
      `SELECT electeur_id FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    if (link.length === 0) {
      return res.status(404).json({ message: "Électeur non inscrit à cette élection" });
    }

    await pool.execute(
      `UPDATE utilisateur SET nom=?, prenom=?, email=?, actif=? WHERE id=?`,
      [nom, prenom, email, actif !== undefined ? actif : true, electeurId]
    );

    res.json({ message: "Électeur modifié" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SUPPRIMER UN ELECTEUR D'UNE ELECTION (ADMIN) =================
export const removeElecteur = async (req, res) => {
  try {
    const { electionId, electeurId } = req.params;
    const adminId = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election, statut FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (elecRows[0].statut === "EN_COURS") {
      return res.status(403).json({ message: "Impossible de retirer un électeur pendant l'élection" });
    }

    const [voteRows] = await pool.execute(
      `SELECT id_vote FROM vote WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    if (voteRows.length > 0) {
      return res.status(403).json({ message: "Impossible de retirer un électeur ayant déjà voté" });
    }

    await pool.execute(
      `DELETE FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    res.json({ message: "Électeur retiré de l'élection" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= IMPORT CSV ELECTEURS (ADMIN) =================
export const importElecteursCSV = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { electeurs }  = req.body;
    const adminId        = req.user.id;

    if (!Array.isArray(electeurs) || electeurs.length === 0) {
      return res.status(400).json({ message: "Aucun électeur à importer" });
    }

    const [elecRows] = await pool.execute(
      `SELECT id_election, statut, titre FROM election WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );

    if (elecRows.length === 0) {
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });
    }

    if (elecRows[0].statut === "TERMINEE") {
      return res.status(403).json({ message: "Impossible d'importer à ce stade" });
    }

    const titreElection = elecRows[0].titre;

    let inserted = 0;
    const errors  = [];
    const results = [];

    for (const e of electeurs) {
      try {
        const rawPassword    = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        let userId;
        const [existing] = await pool.execute(
          `SELECT id FROM utilisateur WHERE email = ?`,
          [e.email.trim()]
        );

        if (existing.length > 0) {
          userId = existing[0].id;
        } else {
          const [userResult] = await pool.execute(
            `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, ?, 'ELECTEUR', ?)`,
            [e.nom.trim(), e.prenom.trim(), e.email.trim(), hashedPassword,
             e.actif !== undefined ? e.actif : true]
          );
          userId = userResult.insertId;
        }

        const [alreadyIn] = await pool.execute(
          `SELECT electeur_id FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
          [userId, electionId]
        );

        if (alreadyIn.length === 0) {
          await pool.execute(
            `INSERT INTO electeur_election (electeur_id, election_id, a_vote) VALUES (?, ?, 0)`,
            [userId, electionId]
          );
          inserted++;
          results.push({
            nom:          e.nom,
            prenom:       e.prenom,
            email:        e.email,
            mot_de_passe: rawPassword,
          });

          try {
            await sendCredentialsEmail({
              email:        e.email.trim(),
              nom:          e.nom.trim(),
              prenom:       e.prenom.trim(),
              motDePasse:   rawPassword,
              titreElection,
            });
          } catch (mailErr) {
            console.error(`⚠️ Email non envoyé à ${e.email} :`, mailErr.message);
          }
        }
      } catch (err) {
        errors.push({ electeur: e.email, erreur: err.message });
      }
    }

    res.status(201).json({
      message:   `${inserted} électeur(s) importé(s)`,
      inserted,
      electeurs: results,
      errors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= REINITIALISER MOT DE PASSE ELECTEUR (ADMIN) =================
export const resetPasswordElecteur = async (req, res) => {
  try {
    const { electeurId } = req.params;

    const rawPassword    = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await pool.execute(
      `UPDATE utilisateur SET mot_de_passe = ? WHERE id = ?`,
      [hashedPassword, electeurId]
    );

    const [rows] = await pool.execute(
      `SELECT nom, prenom, email FROM utilisateur WHERE id = ?`,
      [electeurId]
    );

    if (rows.length > 0) {
      const { nom, prenom, email } = rows[0];
      try {
        await sendCredentialsEmail({
          email,
          nom,
          prenom,
          motDePasse:    rawPassword,
          titreElection: "votre élection",
        });
      } catch (mailErr) {
        console.error(`⚠️ Email reset non envoyé à ${email} :`, mailErr.message);
      }
    }

    res.json({
      message:      "Mot de passe réinitialisé",
      mot_de_passe: rawPassword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= LISTE DES ELECTIONS DE L'ELECTEUR =================
export const getElecteurElections = async (req, res) => {
  try {
    const electeurId = req.user.id;
    console.log("🔍 electeurId:", electeurId);

    const [rows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.statut,
             e.date_debut, e.date_fin,
             s.type,
             ee.a_vote
      FROM election e
      JOIN electeur_election ee ON e.id_election = ee.election_id
      JOIN scrutin s            ON s.election_id = e.id_election
      WHERE ee.electeur_id = ?
      ORDER BY e.date_debut DESC
    `, [electeurId]);

    console.log("📋 élections trouvées:", rows.length);
    res.json(rows);
  } catch (error) {
    console.error("❌ Erreur SQL:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ================= DETAIL D'UNE ELECTION (ELECTEUR) =================
export const getElectionDetail = async (req, res) => {
  try {
    const { electionId } = req.params;
    const electeurId     = req.user.id;

    const [rows] = await pool.execute(`
      SELECT e.id_election, e.titre, e.statut,
             e.date_debut, e.date_fin,
             s.type,
             ee.a_vote
      FROM election e
      JOIN electeur_election ee ON e.id_election = ee.election_id
      JOIN scrutin s            ON s.election_id = e.id_election
      WHERE e.id_election = ? AND ee.electeur_id = ?
    `, [electionId, electeurId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable ou accès refusé" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Erreur getElectionDetail:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ================= CANDIDATS D'UNE ELECTION (ELECTEUR) =================
export const getCandidatsElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const electeurId     = req.user.id;

    const [check] = await pool.execute(
      `SELECT electeur_id FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    if (check.length === 0) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const [rows] = await pool.execute(`
      SELECT c.id_candidat, c.nom, c.parti, c.photo, c.age, c.liste_id
      FROM candidat c
      WHERE c.election_id = ?
      ORDER BY c.nom ASC
    `, [electionId]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Erreur getCandidatsElection:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ================= LISTES D'UNE ELECTION (ELECTEUR) =================
export const getListesElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const electeurId     = req.user.id;

    const [check] = await pool.execute(
      `SELECT electeur_id FROM electeur_election WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    if (check.length === 0) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const [rows] = await pool.execute(`
      SELECT l.liste_id, l.nom,
             COUNT(c.id_candidat) AS nb_candidats
      FROM liste l
      LEFT JOIN candidat c ON c.liste_id = l.liste_id
      WHERE l.election_id = ?
      GROUP BY l.liste_id
      ORDER BY l.nom ASC
    `, [electionId]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Erreur getListesElection:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ================= VOTER (ELECTEUR) =================
export const voterElection = async (req, res) => {
  try {
    const { electionId }   = req.params;
    const { candidat_ids } = req.body;
    const electeurId       = req.user.id;

    // 1. Vérifier que l'élection existe et est EN_COURS
    const [elecRows] = await pool.execute(
      `SELECT e.statut, e.titre, s.type
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ?`,
      [electionId]
    );

    if (elecRows.length === 0)
      return res.status(404).json({ message: "Élection introuvable" });
    if (elecRows[0].statut !== "EN_COURS")
      return res.status(403).json({ message: "L'élection n'est pas en cours" });

    // 2. Vérifier inscription + déjà voté
    const [alreadyVoted] = await pool.execute(
      `SELECT a_vote FROM electeur_election
       WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    if (alreadyVoted.length === 0)
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à cette élection" });
    if (alreadyVoted[0].a_vote)
      return res.status(403).json({ message: "Vous avez déjà voté" });

    // 3. Enregistrer les votes
    for (const candidatId of candidat_ids) {
      await pool.execute(
        `INSERT INTO vote (electeur_id, election_id, candidat_id) VALUES (?, ?, ?)`,
        [electeurId, electionId, candidatId]
      );
    }

    // 4. Marquer l'électeur comme ayant voté
    await pool.execute(
      `UPDATE electeur_election SET a_vote = 1
       WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    // 5. ✅ Envoyer l'e-mail de confirmation (non bloquant)
    try {
      const [userRows] = await pool.execute(
        `SELECT nom, prenom, email FROM utilisateur WHERE id = ?`,
        [electeurId]
      );

      if (userRows.length > 0) {
        const { nom, prenom, email } = userRows[0];
        const dateVote = new Date().toLocaleString("fr-FR", {
          day:    "2-digit",
          month:  "long",
          year:   "numeric",
          hour:   "2-digit",
          minute: "2-digit",
        });

        await sendVoteConfirmationEmail({
          email,
          nom,
          prenom,
          titreElection: elecRows[0].titre,
          dateVote,
        });
      }
    } catch (mailErr) {
      // L'échec de l'email ne bloque PAS la confirmation du vote
      console.error("⚠️ Email de confirmation non envoyé :", mailErr.message);
    }

    res.json({ message: "Vote enregistré avec succès" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
