import { pool }                                  from "../config/db.js";
import { initierCollecte, verifierStatutCampay } from "../services/campay.service.js";

// ─────────────────────────────────────────────────────────────────────
// ÉTAPE 1 — Initier le paiement (admin déjà connecté)
// POST /api/campay/initier-paiement
// ─────────────────────────────────────────────────────────────────────
export const initierPaiement = async (req, res) => {
  const adminId = req.user.id;
  const { telephone, donnees_election } = req.body;

  if (!/^237[0-9]{9}$/.test(telephone)) {
    return res.status(400).json({
      success: false,
      message: "Numéro invalide. Format attendu : 237XXXXXXXXX (ex: 2376XXXXXXXX)",
    });
  }

  if (!donnees_election?.titre || !donnees_election?.startDate) {
    return res.status(400).json({
      success: false,
      message: "Le titre et la date de début sont obligatoires.",
    });
  }

  try {
    const paiement = await initierCollecte(telephone, adminId);

    await pool.execute(
      `INSERT INTO transaction_paiement
        (admin_id, campay_reference, external_reference, montant, statut, donnees_election)
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [
        adminId,
        paiement.campay_reference,
        paiement.external_reference,
        paiement.montant,
        JSON.stringify(donnees_election),
      ]
    );

    return res.status(200).json({
      success:          true,
      campay_reference: paiement.campay_reference,
      ussd_code:        paiement.ussd_code,
      montant:          paiement.montant,
      message:          "Vérifiez votre téléphone et confirmez le paiement avec votre PIN.",
    });

  } catch (error) {
    console.error("Erreur initierPaiement:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Échec de l'initialisation du paiement CamPay.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// ÉTAPE 2 — Vérifier statut (admin déjà connecté, polling frontend)
// GET /api/campay/statut/:reference
// ─────────────────────────────────────────────────────────────────────
export const verifierPaiement = async (req, res) => {
  const { reference } = req.params;
  const adminId       = req.user.id;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transaction_paiement
       WHERE campay_reference = ? AND admin_id = ?`,
      [reference, adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Transaction introuvable." });
    }

    const transaction = rows[0];

    if (transaction.statut === "SUCCESSFUL") {
      return res.json({ success: true, status: "SUCCESSFUL" });
    }
    if (transaction.statut === "FAILED") {
      return res.json({ success: true, status: "FAILED" });
    }

    const campayData = await verifierStatutCampay(reference);

    if (campayData.status === "SUCCESSFUL") {
      const donnees  = JSON.parse(transaction.donnees_election);
      const election = await creerElectionEnDB(donnees, adminId);

      await pool.execute(
        `UPDATE transaction_paiement
         SET statut = 'SUCCESSFUL', date_confirmation = NOW()
         WHERE campay_reference = ?`,
        [reference]
      );

      return res.json({ success: true, status: "SUCCESSFUL", election });
    }

    if (campayData.status === "FAILED") {
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'FAILED' WHERE campay_reference = ?`,
        [reference]
      );
    }

    return res.json({ success: true, status: campayData.status });

  } catch (error) {
    console.error("Erreur verifierPaiement:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Erreur de vérification." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC — Initier paiement SANS JWT (inscription en cours)
// POST /api/campay/initier-paiement-public
// Body: { telephone, user_id, donnees_election }
// ─────────────────────────────────────────────────────────────────────
export const initierPaiementPublic = async (req, res) => {
  const { telephone, user_id, donnees_election } = req.body;

  if (!/^237[0-9]{9}$/.test(telephone)) {
    return res.status(400).json({
      success: false,
      message: "Numéro invalide. Format attendu : 237XXXXXXXXX",
    });
  }

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id manquant.",
    });
  }

  if (!donnees_election?.titre) {
    return res.status(400).json({
      success: false,
      message: "Les données de l'élection sont manquantes.",
    });
  }

  try {
    const paiement = await initierCollecte(telephone, user_id);

    await pool.execute(
      `INSERT INTO transaction_paiement
        (admin_id, campay_reference, external_reference, montant, statut, donnees_election)
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [
        user_id,
        paiement.campay_reference,
        paiement.external_reference,
        paiement.montant,
        JSON.stringify(donnees_election),
      ]
    );

    return res.status(200).json({
      success:          true,
      campay_reference: paiement.campay_reference,
      ussd_code:        paiement.ussd_code,
      montant:          paiement.montant,
      message:          "Vérifiez votre téléphone et confirmez le paiement avec votre PIN.",
    });

  } catch (error) {
    console.error("Erreur initierPaiementPublic:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Échec de l'initialisation du paiement CamPay.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC — Vérifier statut SANS JWT (polling pendant inscription)
// GET /api/campay/statut-public/:reference
// ─────────────────────────────────────────────────────────────────────
export const verifierPaiementPublic = async (req, res) => {
  const { reference } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transaction_paiement WHERE campay_reference = ?`,
      [reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Transaction introuvable." });
    }

    const transaction = rows[0];

    // Déjà traitée → retourner directement sans rappeler CamPay
    if (transaction.statut === "SUCCESSFUL") {
      return res.json({ success: true, status: "SUCCESSFUL" });
    }
    if (transaction.statut === "FAILED") {
      return res.json({ success: true, status: "FAILED" });
    }

    // Interroger CamPay
    const campayData = await verifierStatutCampay(reference);

    if (campayData.status === "SUCCESSFUL") {
      const donnees = JSON.parse(transaction.donnees_election);

      // Créer l'élection en DB
      await creerElectionEnDB(donnees, transaction.admin_id);

      // Activer le compte : ADMIN_ELECTION_PENDING → ADMIN_ELECTION
      await pool.execute(
        `UPDATE utilisateur
         SET role = 'ADMIN_ELECTION', actif = 1
         WHERE id = ?`,
        [transaction.admin_id]
      );

      // Marquer la transaction SUCCESSFUL
      await pool.execute(
        `UPDATE transaction_paiement
         SET statut = 'SUCCESSFUL', date_confirmation = NOW()
         WHERE campay_reference = ?`,
        [reference]
      );

      console.log("✅ Paiement public confirmé pour user_id:", transaction.admin_id);
      return res.json({ success: true, status: "SUCCESSFUL" });
    }

    if (campayData.status === "FAILED") {
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'FAILED' WHERE campay_reference = ?`,
        [reference]
      );
      return res.json({ success: true, status: "FAILED" });
    }

    // Toujours PENDING
    return res.json({ success: true, status: campayData.status });

  } catch (error) {
    console.error("Erreur verifierPaiementPublic:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Erreur de vérification." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// WEBHOOK — CamPay notifie automatiquement (pas d'auth JWT)
// POST /api/campay/webhook
// ─────────────────────────────────────────────────────────────────────
export const webhook = async (req, res) => {
  const { reference, status } = req.body;
  console.log("📩 Webhook CamPay reçu:", req.body);

  try {
    if (status === "SUCCESSFUL") {
      const [rows] = await pool.execute(
        `SELECT * FROM transaction_paiement
         WHERE campay_reference = ? AND statut = 'PENDING'`,
        [reference]
      );

      if (rows.length > 0) {
        const transaction = rows[0];
        const donnees     = JSON.parse(transaction.donnees_election);

        // Créer l'élection
        await creerElectionEnDB(donnees, transaction.admin_id);

        // Activer le compte admin
        await pool.execute(
          `UPDATE utilisateur
           SET role = 'ADMIN_ELECTION', actif = 1
           WHERE id = ?`,
          [transaction.admin_id]
        );

        // Marquer SUCCESSFUL
        await pool.execute(
          `UPDATE transaction_paiement
           SET statut = 'SUCCESSFUL', date_confirmation = NOW()
           WHERE campay_reference = ?`,
          [reference]
        );

        console.log("✅ Élection créée via webhook pour admin_id:", transaction.admin_id);
      }
    }
  } catch (err) {
    console.error("Erreur webhook:", err.message);
  }

  // Toujours répondre 200 à CamPay
  return res.status(200).json({ received: true });
};

// ─────────────────────────────────────────────────────────────────────
// Utilitaire interne — crée election + scrutin en DB
// ─────────────────────────────────────────────────────────────────────
async function creerElectionEnDB(donnees, adminId) {
  const {
    titre,
    description      = "",
    startDate,
    endDate,
    type             = "UNINOMINAL",
    dureeTourMinutes,
    nbSieges,
  } = donnees;

  const isListe = type === "LISTE";

  const toLocalMySQL = (d) => {
    const date = new Date(d);
    const pad  = (n) => String(n).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
    );
  };

  const dateDebut = toLocalMySQL(new Date(startDate));
  const dateFin   = isListe
    ? toLocalMySQL(new Date(new Date(startDate).getTime() + (dureeTourMinutes || 1440) * 60000))
    : toLocalMySQL(new Date(endDate));

  const [result] = await pool.execute(
    `INSERT INTO election
      (titre, description, date_debut, date_fin, statut, admin_id,
       tour_courant, nb_sieges, duree_tour_minutes)
     VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, 1, ?, ?)`,
    [
      titre,
      description,
      dateDebut,
      dateFin,
      adminId,
      isListe ? (nbSieges || 0) : 0,
      isListe ? (dureeTourMinutes || 1440) : 1440,
    ]
  );

  const electionId = result.insertId;

  await pool.execute(
    `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
    [type, electionId]
  );

  return { id_election: electionId, titre, statut: "EN_ATTENTE" };
}
































// import { pool }                                    from "../config/db.js";
// import { initierCollecte, verifierStatutCampay }   from "../services/campay.service.js";

// // ─────────────────────────────────────────────────────────────────────
// // ÉTAPE 1 — Initier le paiement avant création d'élection
// // POST /api/campay/initier-paiement
// // Body: { telephone, donnees_election: { titre, description,
// //         startDate, endDate, type, dureeTourMinutes, nbSieges } }
// // ─────────────────────────────────────────────────────────────────────
// export const initierPaiement = async (req, res) => {
//   const adminId           = req.user.id;
//   const { telephone, donnees_election } = req.body;

//   // Validation numéro (format camerounais 237XXXXXXXXX)
//   if (!/^237[0-9]{9}$/.test(telephone)) {
//     return res.status(400).json({
//       success: false,
//       message: "Numéro invalide. Format attendu : 237XXXXXXXXX (ex: 2376XXXXXXXX)",
//     });
//   }

//   // Validation données minimales
//   if (!donnees_election?.titre || !donnees_election?.startDate) {
//     return res.status(400).json({
//       success: false,
//       message: "Le titre et la date de début sont obligatoires.",
//     });
//   }

//   try {
//     const paiement = await initierCollecte(telephone, adminId);

//     // Sauvegarder la transaction en DB (statut PENDING)
//     await pool.execute(
//       `INSERT INTO transaction_paiement
//         (admin_id, campay_reference, external_reference, montant, statut, donnees_election)
//        VALUES (?, ?, ?, ?, 'PENDING', ?)`,
//       [
//         adminId,
//         paiement.campay_reference,
//         paiement.external_reference,
//         paiement.montant,
//         JSON.stringify(donnees_election),
//       ]
//     );

//     return res.status(200).json({
//       success:          true,
//       campay_reference: paiement.campay_reference,
//       ussd_code:        paiement.ussd_code,
//       montant:          paiement.montant,
//       message:          "Vérifiez votre téléphone et confirmez le paiement avec votre PIN.",
//     });

//   } catch (error) {
//     console.error("Erreur initierPaiement:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Échec de l'initialisation du paiement CamPay.",
//     });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // ÉTAPE 2 — Vérifier le statut (polling frontend toutes les 5s)
// // GET /api/campay/statut/:reference
// // ─────────────────────────────────────────────────────────────────────
// export const verifierPaiement = async (req, res) => {
//   const { reference } = req.params;
//   const adminId       = req.user.id;

//   try {
//     // 1. Retrouver la transaction dans votre DB
//     const [rows] = await pool.execute(
//       `SELECT * FROM transaction_paiement
//        WHERE campay_reference = ? AND admin_id = ?`,
//       [reference, adminId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Transaction introuvable." });
//     }

//     const transaction = rows[0];

//     // 2. Si déjà traitée → retourner directement
//     if (transaction.statut === "SUCCESSFUL") {
//       return res.json({ success: true, status: "SUCCESSFUL" });
//     }
//     if (transaction.statut === "FAILED") {
//       return res.json({ success: true, status: "FAILED" });
//     }

//     // 3. Interroger CamPay
//     const campayData = await verifierStatutCampay(reference);

//     if (campayData.status === "SUCCESSFUL") {
//       // 4. Créer l'élection + scrutin
//       const donnees  = JSON.parse(transaction.donnees_election);
//       const election = await creerElectionEnDB(donnees, adminId);

//       // 5. Marquer la transaction SUCCESSFUL
//       await pool.execute(
//         `UPDATE transaction_paiement
//          SET statut = 'SUCCESSFUL', date_confirmation = NOW()
//          WHERE campay_reference = ?`,
//         [reference]
//       );

//       return res.json({ success: true, status: "SUCCESSFUL", election });
//     }

//     if (campayData.status === "FAILED") {
//       await pool.execute(
//         `UPDATE transaction_paiement SET statut = 'FAILED' WHERE campay_reference = ?`,
//         [reference]
//       );
//     }

//     return res.json({ success: true, status: campayData.status });

//   } catch (error) {
//     console.error("Erreur verifierPaiement:", error.response?.data || error.message);
//     return res.status(500).json({ success: false, message: "Erreur de vérification." });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // WEBHOOK — CamPay notifie automatiquement (pas d'auth JWT)
// // POST /api/campay/webhook
// // ─────────────────────────────────────────────────────────────────────
// export const webhook = async (req, res) => {
//   const { reference, status } = req.body;
//   console.log("📩 Webhook CamPay reçu:", req.body);

//   try {
//     if (status === "SUCCESSFUL") {
//       const [rows] = await pool.execute(
//         `SELECT * FROM transaction_paiement
//          WHERE campay_reference = ? AND statut = 'PENDING'`,
//         [reference]
//       );

//       if (rows.length > 0) {
//         const transaction = rows[0];
//         const donnees     = JSON.parse(transaction.donnees_election);

//         await creerElectionEnDB(donnees, transaction.admin_id);

//         await pool.execute(
//           `UPDATE transaction_paiement
//            SET statut = 'SUCCESSFUL', date_confirmation = NOW()
//            WHERE campay_reference = ?`,
//           [reference]
//         );

//         console.log("✅ Élection créée via webhook pour admin_id:", transaction.admin_id);
//       }
//     }
//   } catch (err) {
//     console.error("Erreur webhook:", err.message);
//   }

//   // Toujours répondre 200 à CamPay
//   return res.status(200).json({ received: true });
// };

// // ─────────────────────────────────────────────────────────────────────
// // Utilitaire interne — crée election + scrutin en DB
// // (même logique que votre submitElectionForValidation existant)
// // ─────────────────────────────────────────────────────────────────────
// async function creerElectionEnDB(donnees, adminId) {
//   const {
//     titre,
//     description   = "",
//     startDate,
//     endDate,
//     type          = "UNINOMINAL",
//     dureeTourMinutes,
//     nbSieges,
//   } = donnees;

//   const isListe = type === "LISTE";

//   // Réutilise votre helper toLocalMySQL
//   const toLocalMySQL = (d) => {
//     const date = new Date(d);
//     const pad   = n => String(n).padStart(2, "0");
//     return (
//       `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` +
//       ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
//     );
//   };

//   const dateDebut = toLocalMySQL(new Date(startDate));
//   const dateFin   = isListe
//     ? toLocalMySQL(new Date(new Date(startDate).getTime() + (dureeTourMinutes||1440) * 60000))
//     : toLocalMySQL(new Date(endDate));

//   // Insérer dans `election`
//   const [result] = await pool.execute(
//     `INSERT INTO election
//       (titre, description, date_debut, date_fin, statut, admin_id,
//        tour_courant, nb_sieges, duree_tour_minutes)
//      VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, 1, ?, ?)`,
//     [
//       titre, description, dateDebut, dateFin, adminId,
//       isListe ? (nbSieges || 0) : 0,
//       isListe ? (dureeTourMinutes || 1440) : 1440,
//     ]
//   );

//   const electionId = result.insertId;

//   // Insérer dans `scrutin`
//   await pool.execute(
//     `INSERT INTO scrutin (type, election_id) VALUES (?, ?)`,
//     [type, electionId]
//   );

//   return { id_election: electionId, titre, statut: "EN_ATTENTE" };
// }