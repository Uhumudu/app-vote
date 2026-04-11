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

// ✅ Frais fixe : 10 XAF par voix (référence unique pour toute la logique backend)
const FRAIS_PAR_VOIX = 10;

// ─── GET : Toutes les élections publiques (page d'accueil) ───────────────────
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
        COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp
        ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
      WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
      GROUP BY cp.id
      ORDER BY nb_votes DESC
    `, [id]);

    // ✅ On retourne toujours frais_vote_xaf = 10 pour cohérence avec le front
    res.json({
      election: { ...election, frais_vote_xaf: FRAIS_PAR_VOIX },
      candidats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST : Déposer une candidature publique ─────────────────────────────────
export const submitPublicCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, bio, photo_url } = req.body;

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
      INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]);

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
    const {
      candidat_public_id,
      telephone,
      nb_voix       = 1,
      nom_electeur,
      email_electeur,
    } = req.body;

    if (!candidat_public_id || !telephone) {
      return res.status(400).json({ message: "Candidat et téléphone obligatoires." });
    }

    const nbVoixInt = parseInt(nb_voix, 10);
    if (isNaN(nbVoixInt) || nbVoixInt < 1 || nbVoixInt > 100) {
      return res.status(400).json({ message: "Le nombre de voix doit être compris entre 1 et 100." });
    }

    const [[election]] = await pool.execute(`
      SELECT id_election, statut, visibilite, titre
      FROM election WHERE id_election = ?
    `, [id]);

    if (!election) return res.status(404).json({ message: "Élection introuvable." });
    if (election.visibilite !== 'PUBLIQUE')
      return res.status(403).json({ message: "Élection non publique." });
    if (election.statut !== 'EN_COURS')
      return res.status(400).json({ message: "L'élection n'est pas en cours." });

    const [[candidat]] = await pool.execute(`
      SELECT id FROM candidat_public WHERE id = ? AND election_id = ? AND statut = 'APPROUVE'
    `, [candidat_public_id, id]);

    if (!candidat) {
      return res.status(404).json({ message: "Candidat introuvable ou non approuvé." });
    }

    // ✅ Calcul du montant : 10 XAF × nb_voix (ignoré la colonne frais_vote_xaf en base)
    // CamPay exige un minimum de 100 XAF — on respecte ce minimum si nécessaire
    const montantCalcule = FRAIS_PAR_VOIX * nbVoixInt;
    const montantCampay  = Math.max(montantCalcule, 100); // minimum CamPay

    // ✅ On enregistre le montant réel calculé (pas le minimum CamPay) en base pour les stats
    const [voteResult] = await pool.execute(`
      INSERT INTO vote_public
        (election_id, candidat_public_id, telephone_electeur, nom_electeur, email_electeur, nb_voix, montant_xaf, statut_paiement)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')
    `, [id, candidat_public_id, telephone, nom_electeur || null, email_electeur || null, nbVoixInt, montantCalcule]);

    const vote_id = voteResult.insertId;

    let campayData;
    try {
      // ✅ CamPay reçoit le montant total calculé (nbVoix × 10 XAF)
      campayData = await initierCollecte(telephone, `vote_public_${vote_id}`, montantCampay);
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

    // ✅ On programme l'expiration automatique côté serveur à 35 secondes
    // (5s de marge par rapport aux 30s du front pour éviter les race conditions)
    setTimeout(async () => {
      try {
        const [[voteActuel]] = await pool.execute(
          `SELECT statut_paiement FROM vote_public WHERE id = ?`,
          [vote_id]
        );
        // Si toujours EN_ATTENTE après 35s, on le marque EXPIRÉ
        if (voteActuel && voteActuel.statut_paiement === 'EN_ATTENTE') {
          await pool.execute(
            `UPDATE vote_public SET statut_paiement = 'EXPIRE' WHERE id = ?`,
            [vote_id]
          );
          console.log(`⏱ Vote #${vote_id} expiré après 35 secondes (ref: ${campayData.campay_reference})`);
        }
      } catch (e) {
        console.error(`❌ Erreur expiration vote #${vote_id}:`, e.message);
      }
    }, 35_000); // 35 000 ms = 35 secondes

    res.json({
      message:           "Notification envoyée. Confirmez le paiement sur votre téléphone.",
      campay_reference:  campayData.campay_reference,
      vote_id,
      nb_voix:           nbVoixInt,
      frais_unitaire:    FRAIS_PAR_VOIX,
      montant_total:     montantCalcule,
      montant_campay:    montantCampay,
      expires_in:        30, // secondes (info pour le front)
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

    // ✅ Vérifier d'abord si le vote a expiré côté base avant d'appeler CamPay
    const [[voteLocal]] = await pool.execute(
      `SELECT statut_paiement FROM vote_public WHERE campay_reference = ?`,
      [reference]
    );

    if (voteLocal && voteLocal.statut_paiement === 'EXPIRE') {
      return res.json({ status: 'FAILED', reason: 'EXPIRED' });
    }

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
            vp.nb_voix,
            vp.montant_xaf,
            e.titre    AS election_titre,
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
            nbVoix:          voteInfo.nb_voix || 1,
            montantTotal:    voteInfo.montant_xaf || FRAIS_PAR_VOIX,
            campayRef:       reference,
            election_id:     voteInfo.election_id,
          }).catch(err => console.error("❌ Email vote confirmé :", err));
        }
      } catch (e) {
        console.error("❌ Erreur récupération info vote pour email :", e.message);
      }

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
      SELECT cp.*, e.titre AS election_titre, e.date_debut, e.date_fin, e.statut AS election_statut
      FROM candidat_public cp
      JOIN election e ON e.id_election = cp.election_id
      WHERE cp.id = ?
    `, [candidat_id]);

    if (!candidat) return res.status(404).json({ message: "Candidat introuvable." });

    const [votes] = await pool.execute(`
      SELECT nom_electeur, nb_voix, montant_xaf, created_at
      FROM vote_public
      WHERE candidat_public_id = ? AND statut_paiement = 'PAYÉ'
      ORDER BY created_at DESC
    `, [candidat_id]);

    const [classement] = await pool.execute(`
      SELECT cp.id, cp.nom, cp.prenom, cp.photo_url, COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
      FROM candidat_public cp
      LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
      WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
      GROUP BY cp.id
      ORDER BY nb_votes DESC
    `, [candidat.election_id]);

    res.json({ candidat, votes, classement, frais_par_voix: FRAIS_PAR_VOIX });
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
        vp.nb_voix,
        vp.montant_xaf,
        e.titre AS election_titre,
        e.id_election,
        e.statut AS election_statut,
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
        stats[v.id_election].nb_votes      += (v.nb_voix || 1);
        // ✅ Montant réel enregistré en base (nb_voix × 10 XAF)
        stats[v.id_election].total_dépensé += (v.montant_xaf || FRAIS_PAR_VOIX);
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
      SELECT cp.*, COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
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

// // ─── GET : Toutes les élections publiques (page d'accueil) ───────────────────
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
//         AND (
//           e.statut IN ('APPROUVEE', 'EN_COURS')
//           OR (
//             e.statut = 'TERMINEE'
//             AND e.date_fin IS NOT NULL
//             AND e.date_fin >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//           )
//         )
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
//         COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
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

// // ─── POST : Déposer une candidature publique ─────────────────────────────────
// // ✅ FIX PRINCIPAL : photo_url récupéré et inséré en base
// export const submitPublicCandidature = async (req, res) => {
//   try {
//     const { id } = req.params;
//     // ✅ FIX : photo_url inclus dans la déstructuration
//     const { nom, prenom, email, telephone, bio, photo_url } = req.body;

//     if (!nom || !prenom) {
//       return res.status(400).json({ message: "Nom et prénom obligatoires." });
//     }

//     const [[election]] = await pool.execute(`
//       SELECT id_election, statut, visibilite, date_debut
//       FROM election
//       WHERE id_election = ?
//     `, [id]);

//     if (!election) {
//       return res.status(404).json({ message: "Élection introuvable." });
//     }

//     if (election.visibilite !== 'PUBLIQUE') {
//       return res.status(403).json({ message: "Cette élection n'est pas publique." });
//     }

//     if (election.statut === 'EN_COURS') {
//       return res.status(400).json({
//         message: "Les candidatures sont fermées : l'élection est déjà en cours.",
//         code: "ELECTION_EN_COURS",
//       });
//     }

//     if (election.statut === 'TERMINEE') {
//       return res.status(400).json({
//         message: "Les candidatures sont fermées : l'élection est terminée.",
//         code: "ELECTION_TERMINEE",
//       });
//     }

//     if (election.statut !== 'APPROUVEE') {
//       return res.status(400).json({
//         message: "Les candidatures ne sont pas ouvertes pour cette élection.",
//         code: "CANDIDATURE_FERMEE",
//       });
//     }

//     if (email) {
//       const [[dup]] = await pool.execute(
//         `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`, [id, email]
//       );
//       if (dup) return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
//     }

//     // ✅ FIX : photo_url ajouté dans le INSERT (était absent avant !)
//     const [result] = await pool.execute(`
//       INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio, photo_url)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `, [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]);

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
//     const {
//       candidat_public_id,
//       telephone,
//       nb_voix       = 1,
//       nom_electeur,
//       email_electeur,
//     } = req.body;

//     if (!candidat_public_id || !telephone) {
//       return res.status(400).json({ message: "Candidat et téléphone obligatoires." });
//     }

//     const nbVoixInt = parseInt(nb_voix, 10);
//     if (isNaN(nbVoixInt) || nbVoixInt < 1 || nbVoixInt > 100) {
//       return res.status(400).json({ message: "Le nombre de voix doit être compris entre 1 et 100." });
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

//     const [[candidat]] = await pool.execute(`
//       SELECT id FROM candidat_public WHERE id = ? AND election_id = ? AND statut = 'APPROUVE'
//     `, [candidat_public_id, id]);

//     if (!candidat) {
//       return res.status(404).json({ message: "Candidat introuvable ou non approuvé." });
//     }

//     const fraisUnitaire = election.frais_vote_xaf || 100;
//     const montantTotal  = Math.max(fraisUnitaire * nbVoixInt, 100);

//     const [voteResult] = await pool.execute(`
//       INSERT INTO vote_public
//         (election_id, candidat_public_id, telephone_electeur, nom_electeur, email_electeur, nb_voix, montant_xaf, statut_paiement)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')
//     `, [id, candidat_public_id, telephone, nom_electeur || null, email_electeur || null, nbVoixInt, montantTotal]);

//     const vote_id = voteResult.insertId;

//     let campayData;
//     try {
//       campayData = await initierCollecte(telephone, `vote_public_${vote_id}`, montantTotal);
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
//       nb_voix:          nbVoixInt,
//       frais_unitaire:   fraisUnitaire,
//       montant_total:    montantTotal,
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
//             vp.nb_voix,
//             vp.montant_xaf,
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
//             nbVoix:          voteInfo.nb_voix || 1,
//             montantTotal:    voteInfo.montant_xaf || voteInfo.frais_vote_xaf || 100,
//             campayRef:       reference,
//             election_id:     voteInfo.election_id,
//           }).catch(err => console.error("❌ Email vote confirmé :", err));
//         }
//       } catch (e) {
//         console.error("❌ Erreur récupération info vote pour email :", e.message);
//       }

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
// // ✅ FIX : photo_url inclus dans la requête classement
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
//       SELECT nom_electeur, nb_voix, montant_xaf, created_at
//       FROM vote_public
//       WHERE candidat_public_id = ? AND statut_paiement = 'PAYÉ'
//       ORDER BY created_at DESC
//     `, [candidat_id]);

//     // ✅ FIX : photo_url ajouté dans le SELECT du classement
//     const [classement] = await pool.execute(`
//       SELECT cp.id, cp.nom, cp.prenom, cp.photo_url, COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
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
//         vp.nb_voix,
//         vp.montant_xaf,
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
//         stats[v.id_election].nb_votes      += (v.nb_voix || 1);
//         stats[v.id_election].total_dépensé += (v.montant_xaf || v.frais_vote_xaf || 100);
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
//       SELECT cp.*, COALESCE(SUM(vp.nb_voix), 0) AS nb_votes
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







