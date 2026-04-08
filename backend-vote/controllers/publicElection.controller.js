// backend/controllers/publicElection.controller.js
import { pool } from "../config/db.js";
import {
  sendCandidatureReceivedEmail,
  sendNewCandidatureAlertEmail,
  sendCandidatureApprouveeEmail,
  sendCandidatureRejeteeEmail,
  sendVoteConfirmationEmail,
} from "../services/publicMailer.js";
import { initierCollecte, verifierStatutCampay } from "../services/campay.service.js";

// ─── GET : Toutes les élections publiques (page d'accueil) ───────────────────
// Inclut les élections TERMINÉES depuis moins de 7 jours
export const getPublicElections = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        e.id_election,
        e.titre,
        e.description,
        e.date_debut,
        e.date_fin,
        e.statut,
        e.visibilite,
        e.frais_vote_xaf,
        e.tour_courant,
        e.photo_url,
        s.type,
        u.nom    AS nom_admin,
        u.prenom AS prenom_admin,
        COUNT(DISTINCT cp.id)  AS nb_candidats,
        COUNT(DISTINCT vp.id)  AS nb_votes
      FROM election e
      JOIN scrutin     s  ON s.election_id  = e.id_election
      JOIN utilisateur u  ON u.id           = e.admin_id
      LEFT JOIN candidat_public cp ON cp.election_id = e.id_election AND cp.statut = 'APPROUVE'
      LEFT JOIN vote_public     vp ON vp.election_id = e.id_election AND vp.statut_paiement = 'PAYÉ'
      WHERE e.visibilite = 'PUBLIQUE'
        AND (
          e.statut IN ('APPROUVEE', 'EN_COURS')
          OR (
            -- ✅ Elections TERMINÉES : visibles encore 7 jours après date_fin
            e.statut = 'TERMINEE'
            AND e.date_fin IS NOT NULL
            AND e.date_fin >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          )
        )
      GROUP BY e.id_election
      ORDER BY e.date_debut ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET : Détail d'une élection publique ────────────────────────────────────
export const getPublicElectionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[election]] = await pool.execute(`
      SELECT e.*, s.type
      FROM election e
      JOIN scrutin s ON s.election_id = e.id_election
      WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
    `, [id]);

    if (!election) return res.status(404).json({ message: "Élection introuvable ou non publique." });

    const [candidats] = await pool.execute(`
      SELECT
        cp.id,
        cp.nom,
        cp.prenom,
        cp.bio,
        cp.photo_url,
        COUNT(vp.id) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp
        ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
      WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
      GROUP BY cp.id
      ORDER BY nb_votes DESC
    `, [id]);

    res.json({ election, candidats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST : Déposer une candidature publique ─────────────────────────────────
// ✅ RÈGLE : On ne peut candidater QUE si l'élection est en statut APPROUVEE
//    (avant le début). Si EN_COURS ou TERMINEE → refus.
export const submitPublicCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, bio } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: "Nom et prénom obligatoires." });
    }

    const [[election]] = await pool.execute(`
      SELECT id_election, statut, visibilite, date_debut
      FROM election
      WHERE id_election = ?
    `, [id]);

    if (!election) {
      return res.status(404).json({ message: "Élection introuvable." });
    }

    if (election.visibilite !== 'PUBLIQUE') {
      return res.status(403).json({ message: "Cette élection n'est pas publique." });
    }

    // ✅ Seul le statut APPROUVEE permet de candidater
    if (election.statut === 'EN_COURS') {
      return res.status(400).json({
        message: "Les candidatures sont fermées : l'élection est déjà en cours.",
        code: "ELECTION_EN_COURS",
      });
    }

    if (election.statut === 'TERMINEE') {
      return res.status(400).json({
        message: "Les candidatures sont fermées : l'élection est terminée.",
        code: "ELECTION_TERMINEE",
      });
    }

    if (election.statut !== 'APPROUVEE') {
      return res.status(400).json({
        message: "Les candidatures ne sont pas ouvertes pour cette élection.",
        code: "CANDIDATURE_FERMEE",
      });
    }

    if (email) {
      const [[dup]] = await pool.execute(
        `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`, [id, email]
      );
      if (dup) return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
    }

    const [result] = await pool.execute(`
      INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, nom, prenom, email || null, telephone || null, bio || null]);

    const candidat_id = result.insertId;

    const [[elecFull]] = await pool.execute(`
      SELECT e.titre, u.email AS admin_email, u.nom AS admin_nom, u.prenom AS admin_prenom
      FROM election e
      JOIN utilisateur u ON u.id = e.admin_id
      WHERE e.id_election = ?
    `, [id]);

    sendCandidatureReceivedEmail({
      email, nom, prenom,
      titreElection: elecFull.titre,
      candidat_id,
    }).catch(err => console.error("❌ Email candidature reçue :", err));

    sendNewCandidatureAlertEmail({
      adminEmail:      elecFull.admin_email,
      adminNom:        elecFull.admin_nom,
      adminPrenom:     elecFull.admin_prenom,
      candidatNom:     nom,
      candidatPrenom:  prenom,
      candidatEmail:   email,
      candidatTel:     telephone,
      titreElection:   elecFull.titre,
      election_id:     id,
      candidat_id,
    }).catch(err => console.error("❌ Email alerte admin :", err));

    res.status(201).json({
      message: "Candidature soumise avec succès. Elle sera examinée par l'administrateur.",
      candidat_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST : Initier un vote public payant via CamPay ─────────────────────────
export const initiatePublicVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidat_public_id, telephone, nom_electeur, email_electeur } = req.body;

    if (!candidat_public_id || !telephone) {
      return res.status(400).json({ message: "Candidat et téléphone obligatoires." });
    }

    const [[election]] = await pool.execute(`
      SELECT id_election, statut, visibilite, frais_vote_xaf, titre
      FROM election WHERE id_election = ?
    `, [id]);

    if (!election) return res.status(404).json({ message: "Élection introuvable." });
    if (election.visibilite !== 'PUBLIQUE')
      return res.status(403).json({ message: "Élection non publique." });
    if (election.statut !== 'EN_COURS')
      return res.status(400).json({ message: "L'élection n'est pas en cours." });

    // Montant minimum 100 XAF pour CamPay
    const frais = Math.max(election.frais_vote_xaf || 100, 100);

    // Créer le vote en attente
    const [voteResult] = await pool.execute(`
      INSERT INTO vote_public (election_id, candidat_public_id, telephone_electeur, nom_electeur, email_electeur, statut_paiement)
      VALUES (?, ?, ?, ?, ?, 'EN_ATTENTE')
    `, [id, candidat_public_id, telephone, nom_electeur || null, email_electeur || null]);

    const vote_id = voteResult.insertId;

    // Initier la collecte via le service CamPay
    let campayData;
    try {
      campayData = await initierCollecte(telephone, `vote_public_${vote_id}`);
    } catch (campayErr) {
      await pool.execute(`DELETE FROM vote_public WHERE id = ?`, [vote_id]);
      console.error("❌ CamPay collect error:", campayErr.message);
      return res.status(502).json({ message: "Erreur CamPay : " + campayErr.message });
    }

    if (!campayData.campay_reference) {
      await pool.execute(`DELETE FROM vote_public WHERE id = ?`, [vote_id]);
      return res.status(502).json({ message: "Erreur CamPay : référence manquante." });
    }

    await pool.execute(
      `UPDATE vote_public SET campay_reference = ? WHERE id = ?`,
      [campayData.campay_reference, vote_id]
    );

    res.json({
      message:          "Notification envoyée. Confirmez sur votre téléphone.",
      campay_reference: campayData.campay_reference,
      vote_id,
      frais,
    });
  } catch (err) {
    console.error("❌ VOTE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET : Statut d'un paiement de vote public ───────────────────────────────
export const checkPublicVoteStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    const data = await verifierStatutCampay(reference);

    if (data.status === 'SUCCESSFUL') {
      await pool.execute(
        `UPDATE vote_public SET statut_paiement = 'PAYÉ' WHERE campay_reference = ?`,
        [reference]
      );

      try {
        const [[voteInfo]] = await pool.execute(`
          SELECT
            vp.nom_electeur,
            vp.email_electeur,
            vp.telephone_electeur,
            vp.election_id,
            e.titre    AS election_titre,
            e.frais_vote_xaf,
            cp.nom     AS candidat_nom,
            cp.prenom  AS candidat_prenom
          FROM vote_public vp
          JOIN election        e  ON e.id_election       = vp.election_id
          JOIN candidat_public cp ON cp.id               = vp.candidat_public_id
          WHERE vp.campay_reference = ?
        `, [reference]);

        if (voteInfo?.email_electeur) {
          sendVoteConfirmationEmail({
            email:           voteInfo.email_electeur,
            nomElecteur:     voteInfo.nom_electeur,
            candidatNom:     voteInfo.candidat_nom,
            candidatPrenom:  voteInfo.candidat_prenom,
            titreElection:   voteInfo.election_titre,
            frais:           voteInfo.frais_vote_xaf || 100,
            campayRef:       reference,
            election_id:     voteInfo.election_id,
          }).catch(err => console.error("❌ Email vote confirmé :", err));
        }
      } catch { /* email_electeur peut ne pas exister */ }

    } else if (data.status === 'FAILED') {
      await pool.execute(
        `UPDATE vote_public SET statut_paiement = 'ECHEC' WHERE campay_reference = ?`,
        [reference]
      );
    }

    res.json({ status: data.status });
  } catch (err) {
    console.error("❌ CHECK STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET : Dashboard candidat ────────────────────────────────────────────────
export const getCandidatDashboard = async (req, res) => {
  try {
    const { candidat_id } = req.params;

    const [[candidat]] = await pool.execute(`
      SELECT cp.*, e.titre AS election_titre, e.date_debut, e.date_fin, e.statut AS election_statut, e.frais_vote_xaf
      FROM candidat_public cp
      JOIN election e ON e.id_election = cp.election_id
      WHERE cp.id = ?
    `, [candidat_id]);

    if (!candidat) return res.status(404).json({ message: "Candidat introuvable." });

    const [votes] = await pool.execute(`
      SELECT nom_electeur, created_at
      FROM vote_public
      WHERE candidat_public_id = ? AND statut_paiement = 'PAYÉ'
      ORDER BY created_at DESC
    `, [candidat_id]);

    const [classement] = await pool.execute(`
      SELECT cp.id, cp.nom, cp.prenom, COUNT(vp.id) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
      WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
      GROUP BY cp.id
      ORDER BY nb_votes DESC
    `, [candidat.election_id]);

    res.json({ candidat, votes, classement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET : Dashboard électeur ─────────────────────────────────────────────────
export const getElecteurDashboard = async (req, res) => {
  try {
    const { telephone } = req.params;

    const [votes] = await pool.execute(`
      SELECT
        vp.id,
        vp.created_at,
        vp.statut_paiement,
        vp.campay_reference,
        e.titre AS election_titre,
        e.id_election,
        e.statut AS election_statut,
        e.frais_vote_xaf,
        cp.nom    AS candidat_nom,
        cp.prenom AS candidat_prenom
      FROM vote_public vp
      JOIN election        e  ON e.id_election        = vp.election_id
      JOIN candidat_public cp ON cp.id                = vp.candidat_public_id
      WHERE vp.telephone_electeur = ?
      ORDER BY vp.created_at DESC
    `, [telephone]);

    const stats = {};
    for (const v of votes) {
      if (!stats[v.id_election]) {
        stats[v.id_election] = {
          election_titre:  v.election_titre,
          election_statut: v.election_statut,
          nb_votes:        0,
          total_dépensé:   0,
        };
      }
      if (v.statut_paiement === 'PAYÉ') {
        stats[v.id_election].nb_votes++;
        stats[v.id_election].total_dépensé += (v.frais_vote_xaf || 100);
      }
    }

    res.json({ telephone, votes, stats: Object.values(stats) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ADMIN : Lister les candidatures ─────────────────────────────────────────
export const getPublicCandidatures = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.id;

    const [[election]] = await pool.execute(
      `SELECT admin_id FROM election WHERE id_election = ?`, [id]
    );
    if (!election || Number(election.admin_id) !== Number(admin_id)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const [candidats] = await pool.execute(`
      SELECT cp.*, COUNT(vp.id) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
      WHERE cp.election_id = ?
      GROUP BY cp.id
      ORDER BY cp.statut, cp.created_at ASC
    `, [id]);

    res.json(candidats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ADMIN : Approuver / Rejeter une candidature ──────────────────────────────
export const reviewPublicCandidature = async (req, res) => {
  try {
    const { candidat_id } = req.params;
    const { action } = req.body;
    const admin_id = req.user.id;

    if (!['APPROUVE', 'REJETE'].includes(action)) {
      return res.status(400).json({ message: "Action invalide." });
    }

    const [[cand]] = await pool.execute(`
      SELECT cp.election_id, e.admin_id
      FROM candidat_public cp
      JOIN election e ON e.id_election = cp.election_id
      WHERE cp.id = ?
    `, [candidat_id]);

    if (!cand || Number(cand.admin_id) !== Number(admin_id)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await pool.execute(
      `UPDATE candidat_public SET statut = ? WHERE id = ?`,
      [action, candidat_id]
    );

    const [[candInfo]] = await pool.execute(`
      SELECT cp.nom, cp.prenom, cp.email, e.titre AS election_titre, e.date_debut, e.id_election
      FROM candidat_public cp
      JOIN election e ON e.id_election = cp.election_id
      WHERE cp.id = ?
    `, [candidat_id]);

    if (action === 'APPROUVE') {
      sendCandidatureApprouveeEmail({
        email:         candInfo.email,
        nom:           candInfo.nom,
        prenom:        candInfo.prenom,
        titreElection: candInfo.election_titre,
        candidat_id,
        dateDebut: new Date(candInfo.date_debut).toLocaleString("fr-FR", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
      }).catch(err => console.error("❌ Email candidature approuvée :", err));
    } else {
      sendCandidatureRejeteeEmail({
        email:         candInfo.email,
        nom:           candInfo.nom,
        prenom:        candInfo.prenom,
        titreElection: candInfo.election_titre,
      }).catch(err => console.error("❌ Email candidature rejetée :", err));
    }

    res.json({ message: `Candidature ${action === 'APPROUVE' ? 'approuvée' : 'rejetée'}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

































// // backend/controllers/publicElection.controller.js
// import { pool } from "../config/db.js";
// import {
//   sendCandidatureReceivedEmail,
//   sendNewCandidatureAlertEmail,
//   sendCandidatureApprouveeEmail,
//   sendCandidatureRejeteeEmail,
//   sendVoteConfirmationEmail,
// } from "../services/publicMailer.js";
// import { initierCollecte, verifierStatutCampay } from "../services/campay.service.js";

// // ─── GET : Toutes les élections publiques approuvées (page d'accueil) ─────────
// export const getPublicElections = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT
//         e.id_election,
//         e.titre,
//         e.description,
//         e.date_debut,
//         e.date_fin,
//         e.statut,
//         e.visibilite,
//         e.frais_vote_xaf,
//         e.tour_courant,
//         e.photo_url,
//         s.type,
//         u.nom    AS nom_admin,
//         u.prenom AS prenom_admin,
//         COUNT(DISTINCT cp.id)  AS nb_candidats,
//         COUNT(DISTINCT vp.id)  AS nb_votes
//       FROM election e
//       JOIN scrutin     s  ON s.election_id  = e.id_election
//       JOIN utilisateur u  ON u.id           = e.admin_id
//       LEFT JOIN candidat_public cp ON cp.election_id = e.id_election AND cp.statut = 'APPROUVE'
//       LEFT JOIN vote_public     vp ON vp.election_id = e.id_election AND vp.statut_paiement = 'PAYÉ'
//       WHERE e.visibilite = 'PUBLIQUE'
//         AND e.statut IN ('APPROUVEE', 'EN_COURS')
//       GROUP BY e.id_election
//       ORDER BY e.date_debut ASC
//     `);
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── GET : Détail d'une élection publique ────────────────────────────────────
// export const getPublicElectionDetail = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [[election]] = await pool.execute(`
//       SELECT e.*, s.type
//       FROM election e
//       JOIN scrutin s ON s.election_id = e.id_election
//       WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
//     `, [id]);

//     if (!election) return res.status(404).json({ message: "Élection introuvable ou non publique." });

//     const [candidats] = await pool.execute(`
//       SELECT
//         cp.id,
//         cp.nom,
//         cp.prenom,
//         cp.bio,
//         cp.photo_url,
//         COUNT(vp.id) AS nb_votes
//       FROM candidat_public cp
//       LEFT JOIN vote_public vp
//         ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
//       WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
//       GROUP BY cp.id
//       ORDER BY nb_votes DESC
//     `, [id]);

//     res.json({ election, candidats });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── POST : Déposer une candidature publique (sans compte) ───────────────────
// export const submitPublicCandidature = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, telephone, bio } = req.body;

//     if (!nom || !prenom) {
//       return res.status(400).json({ message: "Nom et prénom obligatoires." });
//     }

//     const [[election]] = await pool.execute(`
//       SELECT id_election, statut, visibilite, date_debut
//       FROM election
//       WHERE id_election = ?
//     `, [id]);

//     if (!election) return res.status(404).json({ message: "Élection introuvable." });
//     if (election.visibilite !== 'PUBLIQUE')
//       return res.status(403).json({ message: "Cette élection n'est pas publique." });
//     if (!['APPROUVEE', 'EN_COURS'].includes(election.statut)) {
//       return res.status(400).json({ message: "Les candidatures ne sont plus acceptées." });
//     }

//     if (email) {
//       const [[dup]] = await pool.execute(
//         `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`, [id, email]
//       );
//       if (dup) return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
//     }

//     const [result] = await pool.execute(`
//       INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `, [id, nom, prenom, email || null, telephone || null, bio || null]);

//     const candidat_id = result.insertId;

//     const [[elecFull]] = await pool.execute(`
//       SELECT e.titre, u.email AS admin_email, u.nom AS admin_nom, u.prenom AS admin_prenom
//       FROM election e
//       JOIN utilisateur u ON u.id = e.admin_id
//       WHERE e.id_election = ?
//     `, [id]);

//     sendCandidatureReceivedEmail({
//       email, nom, prenom,
//       titreElection: elecFull.titre,
//       candidat_id,
//     }).catch(err => console.error("❌ Email candidature reçue :", err));

//     sendNewCandidatureAlertEmail({
//       adminEmail:      elecFull.admin_email,
//       adminNom:        elecFull.admin_nom,
//       adminPrenom:     elecFull.admin_prenom,
//       candidatNom:     nom,
//       candidatPrenom:  prenom,
//       candidatEmail:   email,
//       candidatTel:     telephone,
//       titreElection:   elecFull.titre,
//       election_id:     id,
//       candidat_id,
//     }).catch(err => console.error("❌ Email alerte admin :", err));

//     res.status(201).json({
//       message: "Candidature soumise avec succès. Elle sera examinée par l'administrateur.",
//       candidat_id,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── POST : Initier un vote public payant via CamPay ─────────────────────────
// export const initiatePublicVote = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { candidat_public_id, telephone, nom_electeur, email_electeur } = req.body;

//     if (!candidat_public_id || !telephone) {
//       return res.status(400).json({ message: "Candidat et téléphone obligatoires." });
//     }

//     const [[election]] = await pool.execute(`
//       SELECT id_election, statut, visibilite, frais_vote_xaf, titre
//       FROM election WHERE id_election = ?
//     `, [id]);

//     if (!election) return res.status(404).json({ message: "Élection introuvable." });
//     if (election.visibilite !== 'PUBLIQUE')
//       return res.status(403).json({ message: "Élection non publique." });
//     if (election.statut !== 'EN_COURS')
//       return res.status(400).json({ message: "L'élection n'est pas en cours." });

//     // Montant minimum 100 XAF pour CamPay
//     const frais = Math.max(election.frais_vote_xaf || 100, 100);

//     // Créer le vote en attente
//     const [voteResult] = await pool.execute(`
//       INSERT INTO vote_public (election_id, candidat_public_id, telephone_electeur, nom_electeur, email_electeur, statut_paiement)
//       VALUES (?, ?, ?, ?, ?, 'EN_ATTENTE')
//     `, [id, candidat_public_id, telephone, nom_electeur || null, email_electeur || null]);

//     const vote_id = voteResult.insertId;

//     // Initier la collecte via le service CamPay (avec auth username/password)
//     let campayData;
//     try {
//       campayData = await initierCollecte(telephone, `vote_public_${vote_id}`);
//     } catch (campayErr) {
//       await pool.execute(`DELETE FROM vote_public WHERE id = ?`, [vote_id]);
//       console.error("❌ CamPay collect error:", campayErr.message);
//       return res.status(502).json({ message: "Erreur CamPay : " + campayErr.message });
//     }

//     if (!campayData.campay_reference) {
//       await pool.execute(`DELETE FROM vote_public WHERE id = ?`, [vote_id]);
//       return res.status(502).json({ message: "Erreur CamPay : référence manquante." });
//     }

//     await pool.execute(
//       `UPDATE vote_public SET campay_reference = ? WHERE id = ?`,
//       [campayData.campay_reference, vote_id]
//     );

//     res.json({
//       message:          "Notification envoyée. Confirmez sur votre téléphone.",
//       campay_reference: campayData.campay_reference,
//       vote_id,
//       frais,
//     });
//   } catch (err) {
//     console.error("❌ VOTE ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── GET : Statut d'un paiement de vote public ───────────────────────────────
// export const checkPublicVoteStatus = async (req, res) => {
//   try {
//     const { reference } = req.params;

//     // Vérifier le statut via le service CamPay (avec auth username/password)
//     const data = await verifierStatutCampay(reference);

//     if (data.status === 'SUCCESSFUL') {
//       await pool.execute(
//         `UPDATE vote_public SET statut_paiement = 'PAYÉ' WHERE campay_reference = ?`,
//         [reference]
//       );

//       try {
//         const [[voteInfo]] = await pool.execute(`
//           SELECT
//             vp.nom_electeur,
//             vp.email_electeur,
//             vp.telephone_electeur,
//             vp.election_id,
//             e.titre    AS election_titre,
//             e.frais_vote_xaf,
//             cp.nom     AS candidat_nom,
//             cp.prenom  AS candidat_prenom
//           FROM vote_public vp
//           JOIN election        e  ON e.id_election       = vp.election_id
//           JOIN candidat_public cp ON cp.id               = vp.candidat_public_id
//           WHERE vp.campay_reference = ?
//         `, [reference]);

//         if (voteInfo?.email_electeur) {
//           sendVoteConfirmationEmail({
//             email:           voteInfo.email_electeur,
//             nomElecteur:     voteInfo.nom_electeur,
//             candidatNom:     voteInfo.candidat_nom,
//             candidatPrenom:  voteInfo.candidat_prenom,
//             titreElection:   voteInfo.election_titre,
//             frais:           voteInfo.frais_vote_xaf || 100,
//             campayRef:       reference,
//             election_id:     voteInfo.election_id,
//           }).catch(err => console.error("❌ Email vote confirmé :", err));
//         }
//       } catch { /* email_electeur peut ne pas exister */ }

//     } else if (data.status === 'FAILED') {
//       await pool.execute(
//         `UPDATE vote_public SET statut_paiement = 'ECHEC' WHERE campay_reference = ?`,
//         [reference]
//       );
//     }

//     res.json({ status: data.status });
//   } catch (err) {
//     console.error("❌ CHECK STATUS ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── GET : Dashboard candidat ────────────────────────────────────────────────
// export const getCandidatDashboard = async (req, res) => {
//   try {
//     const { candidat_id } = req.params;

//     const [[candidat]] = await pool.execute(`
//       SELECT cp.*, e.titre AS election_titre, e.date_debut, e.date_fin, e.statut AS election_statut, e.frais_vote_xaf
//       FROM candidat_public cp
//       JOIN election e ON e.id_election = cp.election_id
//       WHERE cp.id = ?
//     `, [candidat_id]);

//     if (!candidat) return res.status(404).json({ message: "Candidat introuvable." });

//     const [votes] = await pool.execute(`
//       SELECT nom_electeur, created_at
//       FROM vote_public
//       WHERE candidat_public_id = ? AND statut_paiement = 'PAYÉ'
//       ORDER BY created_at DESC
//     `, [candidat_id]);

//     const [classement] = await pool.execute(`
//       SELECT cp.id, cp.nom, cp.prenom, COUNT(vp.id) AS nb_votes
//       FROM candidat_public cp
//       LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
//       WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
//       GROUP BY cp.id
//       ORDER BY nb_votes DESC
//     `, [candidat.election_id]);

//     res.json({ candidat, votes, classement });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── GET : Dashboard électeur ─────────────────────────────────────────────────
// export const getElecteurDashboard = async (req, res) => {
//   try {
//     const { telephone } = req.params;

//     const [votes] = await pool.execute(`
//       SELECT
//         vp.id,
//         vp.created_at,
//         vp.statut_paiement,
//         vp.campay_reference,
//         e.titre AS election_titre,
//         e.id_election,
//         e.statut AS election_statut,
//         e.frais_vote_xaf,
//         cp.nom    AS candidat_nom,
//         cp.prenom AS candidat_prenom
//       FROM vote_public vp
//       JOIN election        e  ON e.id_election        = vp.election_id
//       JOIN candidat_public cp ON cp.id                = vp.candidat_public_id
//       WHERE vp.telephone_electeur = ?
//       ORDER BY vp.created_at DESC
//     `, [telephone]);

//     const stats = {};
//     for (const v of votes) {
//       if (!stats[v.id_election]) {
//         stats[v.id_election] = {
//           election_titre:  v.election_titre,
//           election_statut: v.election_statut,
//           nb_votes:        0,
//           total_dépensé:   0,
//         };
//       }
//       if (v.statut_paiement === 'PAYÉ') {
//         stats[v.id_election].nb_votes++;
//         stats[v.id_election].total_dépensé += (v.frais_vote_xaf || 100);
//       }
//     }

//     res.json({ telephone, votes, stats: Object.values(stats) });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── ADMIN : Lister les candidatures ─────────────────────────────────────────
// export const getPublicCandidatures = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const admin_id = req.user.id;

//     const [[election]] = await pool.execute(
//       `SELECT admin_id FROM election WHERE id_election = ?`, [id]
//     );
//     if (!election || Number(election.admin_id) !== Number(admin_id)) {
//       return res.status(403).json({ message: "Accès refusé." });
//     }

//     const [candidats] = await pool.execute(`
//       SELECT cp.*, COUNT(vp.id) AS nb_votes
//       FROM candidat_public cp
//       LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
//       WHERE cp.election_id = ?
//       GROUP BY cp.id
//       ORDER BY cp.statut, cp.created_at ASC
//     `, [id]);

//     res.json(candidats);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ─── ADMIN : Approuver / Rejeter une candidature ──────────────────────────────
// export const reviewPublicCandidature = async (req, res) => {
//   try {
//     const { candidat_id } = req.params;
//     const { action } = req.body;
//     const admin_id = req.user.id;

//     if (!['APPROUVE', 'REJETE'].includes(action)) {
//       return res.status(400).json({ message: "Action invalide." });
//     }

//     const [[cand]] = await pool.execute(`
//       SELECT cp.election_id, e.admin_id
//       FROM candidat_public cp
//       JOIN election e ON e.id_election = cp.election_id
//       WHERE cp.id = ?
//     `, [candidat_id]);

//     if (!cand || Number(cand.admin_id) !== Number(admin_id)) {
//       return res.status(403).json({ message: "Accès refusé." });
//     }

//     await pool.execute(
//       `UPDATE candidat_public SET statut = ? WHERE id = ?`,
//       [action, candidat_id]
//     );

//     const [[candInfo]] = await pool.execute(`
//       SELECT cp.nom, cp.prenom, cp.email, e.titre AS election_titre, e.date_debut, e.id_election
//       FROM candidat_public cp
//       JOIN election e ON e.id_election = cp.election_id
//       WHERE cp.id = ?
//     `, [candidat_id]);

//     if (action === 'APPROUVE') {
//       sendCandidatureApprouveeEmail({
//         email:         candInfo.email,
//         nom:           candInfo.nom,
//         prenom:        candInfo.prenom,
//         titreElection: candInfo.election_titre,
//         candidat_id,
//         dateDebut: new Date(candInfo.date_debut).toLocaleString("fr-FR", {
//           day: "2-digit", month: "2-digit", year: "numeric",
//           hour: "2-digit", minute: "2-digit",
//         }),
//       }).catch(err => console.error("❌ Email candidature approuvée :", err));
//     } else {
//       sendCandidatureRejeteeEmail({
//         email:         candInfo.email,
//         nom:           candInfo.nom,
//         prenom:        candInfo.prenom,
//         titreElection: candInfo.election_titre,
//       }).catch(err => console.error("❌ Email candidature rejetée :", err));
//     }

//     res.json({ message: `Candidature ${action === 'APPROUVE' ? 'approuvée' : 'rejetée'}.` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

