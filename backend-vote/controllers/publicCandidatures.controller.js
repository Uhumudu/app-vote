// backend/controllers/publicCandidatures.controller.js
import bcrypt     from "bcryptjs";
import crypto     from "crypto";
import nodemailer from "nodemailer";
import { pool }   from "../config/db.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genererMotDePasse(longueur = 10) {
  const chars =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from(crypto.randomBytes(longueur))
    .map(b => chars[b % chars.length])
    .join("");
}

async function envoyerEmailIdentifiants({
  email, prenom, nom, motDePasse, electionTitre,
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  await transporter.sendMail({
    from   : `"EVote" <${process.env.EMAIL_USER}>`,
    to     : email,
    subject: "✅ Candidature approuvée — Vos identifiants EVote",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0fdfa;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(13,148,136,.12);">
    <div style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:6px;">🗳</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">EVote</h1>
    </div>
    <div style="padding:36px 40px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;border:1.5px solid #86efac;color:#15803d;padding:6px 18px;border-radius:999px;font-size:13px;font-weight:700;">
          ✅ Candidature approuvée
        </span>
      </div>
      <h2 style="font-size:20px;font-weight:800;color:#0f2a26;margin:0 0 12px;">Félicitations, ${prenom} ${nom} !</h2>
      <p style="color:#475569;line-height:1.7;margin:0 0 20px;font-size:14px;">
        Votre candidature à l'élection <strong style="color:#0f766e;">"${electionTitre}"</strong> a été <strong>approuvée</strong>.
      </p>
      <div style="background:#f0fdfa;border:1.5px solid #99f6e4;border-radius:14px;padding:22px 24px;margin:0 0 20px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.7px;">Vos identifiants</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:130px;">Email</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#0f2a26;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Mot de passe</td>
            <td style="padding:8px 0;">
              <span style="font-family:monospace;background:white;border:1.5px solid #99f6e4;padding:5px 12px;border-radius:8px;font-size:16px;font-weight:700;color:#0f766e;letter-spacing:1.5px;">${motDePasse}</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${frontendUrl}/login" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0f766e,#0d9488);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
          Accéder à mon espace candidat →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
  });
}

// ─── GET /api/public-elections ─────────────────────────────────────────────────
// ✅ CORRECTION PRINCIPALE : photo_url inclus dans le SELECT
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
        e.photo_url,
        u.nom    AS nom_admin,
        u.prenom AS prenom_admin,
        s.type
      FROM election e
      JOIN utilisateur u ON u.id = e.admin_id
      JOIN scrutin     s ON s.election_id = e.id_election
      WHERE e.visibilite = 'PUBLIQUE'
        AND e.statut IN ('EN_COURS', 'APPROUVEE', 'TERMINEE')
      ORDER BY e.date_debut DESC
    `);

    return res.json(rows);
  } catch (err) {
    console.error("[EVote] getPublicElections :", err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/public-elections/:id/detail ─────────────────────────────────────
export const getPublicElectionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT
        e.id_election,
        e.titre,
        e.description,
        e.date_debut,
        e.date_fin,
        e.statut,
        e.visibilite,
        e.photo_url,
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

// ─── POST /api/public-elections/:id/candidater ────────────────────────────────
export const soumettreCandidat = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, bio, photo_url } = req.body;

    if (!nom || !prenom)
      return res.status(400).json({ message: "Nom et prénom sont obligatoires." });

    const [elec] = await pool.execute(
      `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`,
      [id]
    );
    if (!elec.length || elec[0].visibilite !== "PUBLIQUE")
      return res.status(404).json({ message: "Élection publique introuvable." });

    if (["EN_COURS", "TERMINEE"].includes(elec[0].statut))
      return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

    if (email) {
      const [doublon] = await pool.execute(
        `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`,
        [id, email]
      );
      if (doublon.length)
        return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
    }

    await pool.execute(
      `INSERT INTO candidat_public
         (election_id, nom, prenom, email, telephone, bio, photo_url, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
      [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]
    );

    return res.status(201).json({ message: "Candidature soumise avec succès." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/public-elections/:id/candidatures  (admin) ──────────────────────
export const getCandidaturesPubliques = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT cp.*, COUNT(vp.id) AS nb_votes
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

// ─── PUT /api/public-elections/:id/candidatures/:candidatId/review ────────────
export const reviewCandidature = async (req, res) => {
  const { id, candidatId } = req.params;
  const { action }         = req.body;

  if (!["APPROUVE", "REJETE"].includes(action))
    return res.status(400).json({ message: "Action invalide." });

  // ── Rejet simple ──────────────────────────────────────────────────────────
  if (action === "REJETE") {
    try {
      const [rows] = await pool.execute(
        `SELECT id FROM candidat_public WHERE id = ? AND election_id = ?`,
        [candidatId, id]
      );
      if (!rows.length)
        return res.status(404).json({ message: "Candidature introuvable." });

      await pool.execute(
        `UPDATE candidat_public SET statut = 'REJETE' WHERE id = ?`,
        [candidatId]
      );
      return res.json({ message: "Candidature rejetée." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Approbation avec transaction ──────────────────────────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[candidat]] = await conn.execute(
      `SELECT cp.*, e.titre AS election_titre
       FROM candidat_public cp
       JOIN election e ON e.id_election = cp.election_id
       WHERE cp.id = ? AND cp.election_id = ?`,
      [candidatId, id]
    );

    if (!candidat) {
      await conn.rollback();
      return res.status(404).json({ message: "Candidature introuvable." });
    }

    if (candidat.statut === "APPROUVE") {
      await conn.rollback();
      return res.status(400).json({ message: "Cette candidature est déjà approuvée." });
    }

    // 1. Statut → APPROUVE
    await conn.execute(
      `UPDATE candidat_public SET statut = 'APPROUVE' WHERE id = ?`,
      [candidatId]
    );

    // 2. Insérer dans candidat[] pour le vote
    const nomComplet = `${candidat.prenom} ${candidat.nom}`;
    const [existe] = await conn.execute(
      `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
      [id, nomComplet]
    );
    if (!existe.length) {
      await conn.execute(
        `INSERT INTO candidat (nom, photo, election_id) VALUES (?, ?, ?)`,
        [nomComplet, candidat.photo_url || null, id]
      );
    }

    // 3. Créer compte CANDIDAT_PUBLIC
    let utilisateurId = null;
    let motDePasse    = null;
    let emailEchec    = false;

    if (candidat.email) {
      motDePasse    = genererMotDePasse();
      const hash    = await bcrypt.hash(motDePasse, 10);

      const [[existingUser]] = await conn.execute(
        `SELECT id FROM utilisateur WHERE email = ?`,
        [candidat.email]
      );

      if (existingUser) {
        utilisateurId = existingUser.id;
        await conn.execute(
          `UPDATE utilisateur SET role = 'CANDIDAT_PUBLIC', mot_de_passe = ?, actif = 1 WHERE id = ?`,
          [hash, utilisateurId]
        );
      } else {
        const [result] = await conn.execute(
          `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
           VALUES (?, ?, ?, ?, 'CANDIDAT_PUBLIC', 1)`,
          [candidat.nom, candidat.prenom, candidat.email, hash]
        );
        utilisateurId = result.insertId;
      }

      await conn.execute(
        `UPDATE candidat_public SET utilisateur_id = ? WHERE id = ?`,
        [utilisateurId, candidatId]
      );
    }

    await conn.commit();

    // 4. Email hors transaction
    if (candidat.email && motDePasse) {
      try {
        await envoyerEmailIdentifiants({
          email:         candidat.email,
          prenom:        candidat.prenom,
          nom:           candidat.nom,
          motDePasse,
          electionTitre: candidat.election_titre,
        });
      } catch (mailErr) {
        console.error("[EVote] Email non envoyé :", mailErr.message);
        emailEchec = true;
      }
    }

    if (emailEchec) {
      return res.status(200).json({
        message: "Candidature approuvée ✅. ⚠️ Email non envoyé — transmettez les identifiants manuellement.",
        utilisateurId,
        motDePasse,
        emailEchec: true,
      });
    }

    return res.json({
      message: `Candidature approuvée. ${candidat.email ? `Email envoyé à ${candidat.email}.` : "Aucun email renseigné."}`,
      utilisateurId,
    });

  } catch (err) {
    await conn.rollback();
    console.error("[EVote] Erreur approbation :", err);
    return res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// ─── GET /api/public-elections/dashboard/candidat-public/:utilisateurId ───────
export const getDashboardCandidatPublicConnecte = async (req, res) => {
  const { utilisateurId } = req.params;
  try {
    const [[candidat]] = await pool.execute(
      `SELECT cp.*,
              e.titre       AS election_titre,
              e.date_debut,
              e.date_fin,
              e.statut      AS election_statut
       FROM candidat_public cp
       JOIN election e ON e.id_election = cp.election_id
       WHERE cp.utilisateur_id = ?
       LIMIT 1`,
      [utilisateurId]
    );

    if (!candidat)
      return res.status(404).json({ message: "Aucune candidature trouvée." });

    const [votes] = await pool.execute(
      `SELECT nom_electeur, created_at
       FROM vote_public
       WHERE candidat_public_id = ? AND statut_paiement = 'PAYÉ'
       ORDER BY created_at DESC`,
      [candidat.id]
    );

    const [classement] = await pool.execute(
      `SELECT cp.id, cp.nom, cp.prenom, COUNT(vp.id) AS nb_votes
       FROM candidat_public cp
       LEFT JOIN vote_public vp
         ON vp.candidat_public_id = cp.id AND vp.statut_paiement = 'PAYÉ'
       WHERE cp.election_id = ? AND cp.statut = 'APPROUVE'
       GROUP BY cp.id, cp.nom, cp.prenom
       ORDER BY nb_votes DESC`,
      [candidat.election_id]
    );

    return res.json({ candidat, votes, classement });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
























// // backend/controllers/publicCandidatures.controller.js
// import bcrypt     from "bcryptjs";
// import crypto     from "crypto";
// import nodemailer from "nodemailer";
// import { pool }   from "../config/db.js";

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /** Génère un mot de passe lisible (sans 0/O, l/1 ambigus) */
// function genererMotDePasse(longueur = 10) {
//   const chars =
//     "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
//   return Array.from(crypto.randomBytes(longueur))
//     .map(b => chars[b % chars.length])
//     .join("");
// }

// /** Envoie les identifiants au candidat par email */
// async function envoyerEmailIdentifiants({
//   email, prenom, nom, motDePasse, electionTitre,
// }) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS, 
//     },
//   });

//   const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

//   await transporter.sendMail({
//     from   : `"EVote" <${process.env.MAIL_USER}>`,
//     to     : email,
//     subject: "✅ Candidature approuvée — Vos identifiants EVote",
//     html: `
// <!DOCTYPE html>
// <html lang="fr">
// <head><meta charset="UTF-8"/></head>
// <body style="margin:0;padding:0;background:#f0fdfa;
//              font-family:'Segoe UI',Arial,sans-serif;">
//   <div style="max-width:560px;margin:32px auto;background:white;
//               border-radius:20px;overflow:hidden;
//               box-shadow:0 4px 24px rgba(13,148,136,.12);">

//     <!-- En-tête -->
//     <div style="background:linear-gradient(135deg,#0f766e,#0d9488);
//                 padding:32px;text-align:center;">
//       <div style="font-size:36px;margin-bottom:6px;">🗳</div>
//       <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">EVote</h1>
//       <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px;">
//         Plateforme de vote électronique sécurisée
//       </p>
//     </div>

//     <!-- Corps -->
//     <div style="padding:36px 40px;">

//       <div style="text-align:center;margin-bottom:24px;">
//         <span style="display:inline-flex;align-items:center;gap:6px;
//                      background:#f0fdf4;border:1.5px solid #86efac;
//                      color:#15803d;padding:6px 18px;border-radius:999px;
//                      font-size:13px;font-weight:700;">
//           ✅ Candidature approuvée
//         </span>
//       </div>

//       <h2 style="font-size:20px;font-weight:800;color:#0f2a26;
//                  margin:0 0 12px;letter-spacing:-0.3px;">
//         Félicitations, ${prenom} ${nom} !
//       </h2>

//       <p style="color:#475569;line-height:1.7;margin:0 0 20px;font-size:14px;">
//         Votre candidature à l'élection
//         <strong style="color:#0f766e;">"${electionTitre}"</strong>
//         a été <strong>approuvée</strong>.
//         Un espace candidat vous a été créé sur EVote.
//       </p>

//       <!-- Bloc identifiants -->
//       <div style="background:#f0fdfa;border:1.5px solid #99f6e4;
//                   border-radius:14px;padding:22px 24px;margin:0 0 20px;">
//         <p style="margin:0 0 12px;font-size:11px;font-weight:700;
//                   color:#0d9488;text-transform:uppercase;letter-spacing:.7px;">
//           Vos identifiants de connexion
//         </p>
//         <table style="width:100%;border-collapse:collapse;">
//           <tr>
//             <td style="padding:8px 0;font-size:13px;color:#64748b;
//                        font-weight:600;width:130px;">Email</td>
//             <td style="padding:8px 0;font-size:14px;font-weight:700;
//                        color:#0f2a26;">${email}</td>
//           </tr>
//           <tr>
//             <td style="padding:8px 0;font-size:13px;color:#64748b;
//                        font-weight:600;vertical-align:middle;">Mot de passe</td>
//             <td style="padding:8px 0;">
//               <span style="font-family:monospace;background:white;
//                            border:1.5px solid #99f6e4;padding:5px 12px;
//                            border-radius:8px;font-size:16px;font-weight:700;
//                            color:#0f766e;letter-spacing:1.5px;">
//                 ${motDePasse}
//               </span>
//             </td>
//           </tr>
//         </table>
//       </div>

//       <!-- Avertissement -->
//       <div style="background:#fffbeb;border:1px solid #fde68a;
//                   border-radius:10px;padding:12px 16px;margin-bottom:28px;">
//         <p style="margin:0;font-size:12.5px;color:#92400e;line-height:1.6;">
//           ⚠️ <strong>Sécurité :</strong> changez ce mot de passe dès votre
//           première connexion.
//         </p>
//       </div>

//       <!-- CTA -->
//       <div style="text-align:center;">
//         <a href="${frontendUrl}/login"
//            style="display:inline-block;padding:14px 36px;
//                   background:linear-gradient(135deg,#0f766e,#0d9488);
//                   color:white;border-radius:12px;text-decoration:none;
//                   font-weight:700;font-size:15px;
//                   box-shadow:0 4px 18px rgba(13,148,136,.30);">
//           Accéder à mon espace candidat →
//         </a>
//       </div>
//     </div>

//     <!-- Pied -->
//     <div style="padding:16px 40px;border-top:1px solid #f0f0f0;
//                 background:#fafafa;text-align:center;">
//       <p style="margin:0;font-size:11.5px;color:#94a3b8;line-height:1.6;">
//         Support :
//         <a href="mailto:${process.env.MAIL_USER}"
//            style="color:#0d9488;text-decoration:none;">
//           ${process.env.MAIL_USER}
//         </a>
//       </p>
//     </div>
//   </div>
// </body>
// </html>`,
//   });
// }

// // ─── GET /api/public-elections/:id/detail ─────────────────────────────────────
// export const getPublicElectionDetail = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(`
//       SELECT e.id_election, e.titre, e.description,
//              e.date_debut, e.date_fin, e.statut, e.visibilite,
//              s.type
//       FROM election e
//       JOIN scrutin s ON s.election_id = e.id_election
//       WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
//     `, [id]);

//     if (!rows.length)
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     return res.json({ election: rows[0] });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// };

// // ─── POST /api/public-elections/:id/candidater ────────────────────────────────
// export const soumettreCandidat = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nom, prenom, email, telephone, bio, photo_url } = req.body;

//     if (!nom || !prenom)
//       return res.status(400).json({ message: "Nom et prénom sont obligatoires." });

//     const [elec] = await pool.execute(
//       `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`,
//       [id]
//     );
//     if (!elec.length || elec[0].visibilite !== "PUBLIQUE")
//       return res.status(404).json({ message: "Élection publique introuvable." });

//     if (["EN_COURS", "TERMINEE"].includes(elec[0].statut))
//       return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

//     // Vérifier doublon email
//     if (email) {
//       const [doublon] = await pool.execute(
//         `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`,
//         [id, email]
//       );
//       if (doublon.length)
//         return res.status(409).json({
//           message: "Une candidature avec cet email existe déjà.",
//         });
//     }

//     await pool.execute(
//       `INSERT INTO candidat_public
//          (election_id, nom, prenom, email, telephone, bio, photo_url, statut)
//        VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
//       [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]
//     );

//     return res.status(201).json({ message: "Candidature soumise avec succès." });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// };

// // ─── GET /api/public-elections/:id/candidatures  (admin) ──────────────────────
// export const getCandidaturesPubliques = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await pool.execute(`
//       SELECT cp.*,
//              COUNT(vp.id) AS nb_votes
//       FROM candidat_public cp
//       LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id
//       WHERE cp.election_id = ?
//       GROUP BY cp.id
//       ORDER BY cp.created_at DESC
//     `, [id]);

//     return res.json(rows);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// };

// // ─── PUT /api/public-elections/:id/candidatures/:candidatId/review  (admin) ───
// // Modifications vs version originale :
// //  ✅ Si APPROUVE → crée un compte utilisateur (rôle CANDIDAT_PUBLIC)
// //  ✅              → lie utilisateur_id dans candidat_public
// //  ✅              → envoie les identifiants par email
// //  ✅ Tout dans une transaction pour garantir la cohérence
// //  ✅ Logique d'insertion dans candidat[] conservée à l'identique
// export const reviewCandidature = async (req, res) => {
//   const { id, candidatId } = req.params;
//   const { action }         = req.body; 

//   if (!["APPROUVE", "REJETE"].includes(action))
//     return res.status(400).json({ message: "Action invalide." });

//   // ── CAS REJET : pas de transaction nécessaire ────────────────────────────
//   if (action === "REJETE") {
//     try {
//       const [rows] = await pool.execute(
//         `SELECT id FROM candidat_public WHERE id = ? AND election_id = ?`,
//         [candidatId, id]
//       );
//       if (!rows.length)
//         return res.status(404).json({ message: "Candidature introuvable." });

//       await pool.execute(
//         `UPDATE candidat_public SET statut = 'REJETE' WHERE id = ?`,
//         [candidatId]
//       );
//       return res.json({ message: "Candidature rejetée." });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: err.message });
//     }
//   }

//   // ── CAS APPROBATION : transaction complète ───────────────────────────────
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // 1. Récupérer le candidat + titre de l'élection
//     const [[candidat]] = await conn.execute(
//       `SELECT cp.*, e.titre AS election_titre
//        FROM candidat_public cp
//        JOIN election e ON e.id_election = cp.election_id
//        WHERE cp.id = ? AND cp.election_id = ?`,
//       [candidatId, id]
//     );

//     if (!candidat) {
//       await conn.rollback();
//       return res.status(404).json({ message: "Candidature introuvable." });
//     }

//     if (candidat.statut === "APPROUVE") {
//       await conn.rollback();
//       return res.status(400).json({ message: "Cette candidature est déjà approuvée." });
//     }

//     // 2. Mettre à jour le statut dans candidat_public
//     await conn.execute(
//       `UPDATE candidat_public SET statut = 'APPROUVE' WHERE id = ?`,
//       [candidatId]
//     );

//     // 3. Insérer dans candidat[] pour le vote (logique originale conservée)
//     const nomComplet = `${candidat.prenom} ${candidat.nom}`;
//     const [existe] = await conn.execute(
//       `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
//       [id, nomComplet]
//     );
//     if (!existe.length) {
//       await conn.execute(
//         `INSERT INTO candidat (nom, photo, election_id) VALUES (?, ?, ?)`,
//         [nomComplet, candidat.photo_url || null, id]
//       );
//     }

//     // 4. Créer le compte utilisateur (si email fourni)
//     let utilisateurId = null;
//     let motDePasse    = null;
//     let emailEchec    = false;

//     if (candidat.email) {
//       motDePasse    = genererMotDePasse();
//       const hash    = await bcrypt.hash(motDePasse, 10);

//       // Vérifier si un compte existe déjà pour cet email
//       const [[existingUser]] = await conn.execute(
//         `SELECT id FROM utilisateur WHERE email = ?`,
//         [candidat.email]
//       );

//       if (existingUser) {
//         utilisateurId = existingUser.id;
//         // Réinitialise le rôle + mot de passe (cas d'un electeur qui devient candidat)
//         await conn.execute(
//           `UPDATE utilisateur
//            SET role = 'CANDIDAT_PUBLIC', mot_de_passe = ?, actif = 1
//            WHERE id = ?`,
//           [hash, utilisateurId]
//         );
//       } else {
//         const [result] = await conn.execute(
//           `INSERT INTO utilisateur
//              (nom, prenom, email, mot_de_passe, role, actif)
//            VALUES (?, ?, ?, ?, 'CANDIDAT_PUBLIC', 1)`,
//           [candidat.nom, candidat.prenom, candidat.email, hash]
//         );
//         utilisateurId = result.insertId;
//       }

//       // 5. Lier l'utilisateur au candidat_public
//       await conn.execute(
//         `UPDATE candidat_public SET utilisateur_id = ? WHERE id = ?`,
//         [utilisateurId, candidatId]
//       );
//     }

//     // ── Commit avant l'envoi email ───────────────────────────────────────
//     await conn.commit();

//     // 6. Envoi email (hors transaction : un échec mail ne doit pas rollback)
//     if (candidat.email && motDePasse) {
//       try {
//         await envoyerEmailIdentifiants({
//           email        : candidat.email,
//           prenom       : candidat.prenom,
//           nom          : candidat.nom,
//           motDePasse,
//           electionTitre: candidat.election_titre,
//         });
//       } catch (mailErr) {
//         console.error("[EVote] Email non envoyé :", mailErr.message);
//         emailEchec = true;
//       }
//     }

//     // 7. Réponse
//     if (emailEchec) {
//       return res.status(200).json({
//         message:
//           "Candidature approuvée ✅. " +
//           "⚠️ L'email n'a pas pu être envoyé (vérifiez EMAIL_USER / EMAIL_PASS). " +
//           "Communiquez manuellement les identifiants ci-dessous.",
//         utilisateurId,
//         motDePasse,    // fallback pour l'admin
//         emailEchec: true,
//       });
//     }

//     const emailInfo = candidat.email
//       ? `Email envoyé à ${candidat.email}.`
//       : "Aucun email renseigné — aucun compte créé.";

//     return res.json({
//       message      : `Candidature approuvée avec succès. ${emailInfo}`,
//       utilisateurId,
//     });

//   } catch (err) {
//     await conn.rollback();
//     console.error("[EVote] Erreur approbation :", err);
//     return res.status(500).json({ error: err.message });
//   } finally {
//     conn.release();
//   }
// };

// // ─── GET /api/public-elections/dashboard/candidat-public/:utilisateurId ───────
// // Dashboard du candidat une fois connecté
// export const getDashboardCandidatPublicConnecte = async (req, res) => {
//   const { utilisateurId } = req.params;
//   try {
//     // Candidat lié à cet utilisateur
//     const [[candidat]] = await pool.execute(
//       `SELECT cp.*,
//               e.titre       AS election_titre,
//               e.date_debut,
//               e.date_fin,
//               e.statut      AS election_statut
//        FROM candidat_public cp
//        JOIN election e ON e.id_election = cp.election_id
//        WHERE cp.utilisateur_id = ?
//        LIMIT 1`,
//       [utilisateurId]
//     );

//     if (!candidat)
//       return res.status(404).json({
//         message: "Aucune candidature trouvée pour cet utilisateur.",
//       });

//     // Votes reçus (payés)
//     const [votes] = await pool.execute(
//       `SELECT nom_electeur, created_at
//        FROM vote_public
//        WHERE candidat_public_id = ?
//          AND statut_paiement = 'PAYÉ'
//        ORDER BY created_at DESC`,
//       [candidat.id]
//     );

//     // Classement de tous les candidats approuvés de cette élection
//     const [classement] = await pool.execute(
//       `SELECT cp.id, cp.nom, cp.prenom,
//               COUNT(vp.id) AS nb_votes
//        FROM candidat_public cp
//        LEFT JOIN vote_public vp
//          ON vp.candidat_public_id = cp.id
//         AND vp.statut_paiement = 'PAYÉ'
//        WHERE cp.election_id = ?
//          AND cp.statut = 'APPROUVE'
//        GROUP BY cp.id, cp.nom, cp.prenom
//        ORDER BY nb_votes DESC`,
//       [candidat.election_id]
//     );

//     return res.json({ candidat, votes, classement });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// };






























// // // backend/controllers/publicCandidatures.controller.js
// // import { pool } from "../config/db.js";

// // // GET /api/public-elections/:id/detail
// // export const getPublicElectionDetail = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const [rows] = await pool.execute(`
// //       SELECT e.id_election, e.titre, e.description,
// //              e.date_debut, e.date_fin, e.statut, e.visibilite,
// //              s.type
// //       FROM election e
// //       JOIN scrutin s ON s.election_id = e.id_election
// //       WHERE e.id_election = ? AND e.visibilite = 'PUBLIQUE'
// //     `, [id]);

// //     if (!rows.length)
// //       return res.status(404).json({ message: "Élection publique introuvable." });

// //     return res.json({ election: rows[0] });
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(500).json({ error: err.message });
// //   }
// // };

// // // POST /api/public-elections/:id/candidater
// // export const soumettreCandidat = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { nom, prenom, email, telephone, bio, photo_url } = req.body;

// //     if (!nom || !prenom)
// //       return res.status(400).json({ message: "Nom et prénom sont obligatoires." });

// //     const [elec] = await pool.execute(
// //       `SELECT id_election, statut, visibilite FROM election WHERE id_election = ?`, [id]
// //     );
// //     if (!elec.length || elec[0].visibilite !== 'PUBLIQUE')
// //       return res.status(404).json({ message: "Élection publique introuvable." });

// //     if (['EN_COURS', 'TERMINEE'].includes(elec[0].statut))
// //       return res.status(403).json({ message: "Les candidatures ne sont plus acceptées." });

// //     // Vérifier doublon email
// //     if (email) {
// //       const [doublon] = await pool.execute(
// //         `SELECT id FROM candidat_public WHERE election_id = ? AND email = ?`, [id, email]
// //       );
// //       if (doublon.length)
// //         return res.status(409).json({ message: "Une candidature avec cet email existe déjà." });
// //     }

// //     await pool.execute(
// //       `INSERT INTO candidat_public (election_id, nom, prenom, email, telephone, bio, photo_url, statut)
// //        VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
// //       [id, nom, prenom, email || null, telephone || null, bio || null, photo_url || null]
// //     );

// //     return res.status(201).json({ message: "Candidature soumise avec succès." });
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(500).json({ error: err.message });
// //   }
// // };

// // // GET /api/public-elections/:id/candidatures  (admin)
// // export const getCandidaturesPubliques = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const [rows] = await pool.execute(`
// //       SELECT cp.*,
// //              COUNT(vp.id) AS nb_votes
// //       FROM candidat_public cp
// //       LEFT JOIN vote_public vp ON vp.candidat_public_id = cp.id
// //       WHERE cp.election_id = ?
// //       GROUP BY cp.id
// //       ORDER BY cp.created_at DESC
// //     `, [id]);

// //     return res.json(rows);
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(500).json({ error: err.message });
// //   }
// // };

// // // PUT /api/public-elections/:id/candidatures/:candidatId/review  (admin)
// // export const reviewCandidature = async (req, res) => {
// //   try {
// //     const { id, candidatId } = req.params;
// //     const { action } = req.body; // "APPROUVE" ou "REJETE"

// //     if (!['APPROUVE', 'REJETE'].includes(action))
// //       return res.status(400).json({ message: "Action invalide." });

// //     const [rows] = await pool.execute(
// //       `SELECT * FROM candidat_public WHERE id = ? AND election_id = ?`,
// //       [candidatId, id]
// //     );
// //     if (!rows.length)
// //       return res.status(404).json({ message: "Candidature introuvable." });

// //     const candidat = rows[0];

// //     await pool.execute(
// //       `UPDATE candidat_public SET statut = ? WHERE id = ?`,
// //       [action, candidatId]
// //     );

// //     // Si approuvé → insérer dans la table candidat pour qu'il soit visible au vote
// //     if (action === 'APPROUVE') {
// //       const nomComplet = `${candidat.prenom} ${candidat.nom}`;
// //       const [existe] = await pool.execute(
// //         `SELECT id_candidat FROM candidat WHERE election_id = ? AND nom = ?`,
// //         [id, nomComplet]
// //       );
// //       if (!existe.length) {
// //         await pool.execute(
// //           `INSERT INTO candidat (nom, photo, election_id) VALUES (?, ?, ?)`,
// //           [nomComplet, candidat.photo_url || null, id]
// //         );
// //       }
// //     }

// //     return res.json({
// //       message: action === 'APPROUVE'
// //         ? "Candidature approuvée avec succès."
// //         : "Candidature rejetée."
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(500).json({ error: err.message });
// //   }
// // };