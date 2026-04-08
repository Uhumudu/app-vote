import { pool }                                                      from "../config/db.js";
import { initierCollecte, verifierStatutCampay, initierTransfert }   from "../services/campay.service.js";
// ^^^ FIX : initierTransfert était manquant — c'est la cause du "Échec du retrait"

// ─────────────────────────────────────────────────────────────────────
// ÉTAPE 1 — Initier le paiement (admin connecté)
// POST /api/campay/initier-paiement
// ─────────────────────────────────────────────────────────────────────
export const initierPaiement = async (req, res) => {
  const adminId = req.user.id;
  const { telephone, donnees_election } = req.body;

  if (!/^237[0-9]{9}$/.test(telephone)) {
    return res.status(400).json({ success: false, message: "Numéro invalide. Format attendu : 237XXXXXXXXX" });
  }
  if (!donnees_election?.titre || !donnees_election?.startDate) {
    return res.status(400).json({ success: false, message: "Le titre et la date de début sont obligatoires." });
  }

  try {
    const paiement = await initierCollecte(telephone, adminId);

    await pool.execute(
      `INSERT INTO transaction_paiement
        (admin_id, campay_reference, external_reference, montant, statut, donnees_election, type_transaction)
       VALUES (?, ?, ?, ?, 'PENDING', ?, 'CREATION_ELECTION')`,
      [adminId, paiement.campay_reference, paiement.external_reference, paiement.montant, JSON.stringify(donnees_election)]
    );

    return res.status(200).json({
      success: true,
      campay_reference: paiement.campay_reference,
      ussd_code:        paiement.ussd_code,
      montant:          paiement.montant,
      message:          "Vérifiez votre téléphone et confirmez le paiement avec votre PIN.",
    });
  } catch (error) {
    console.error("Erreur initierPaiement:", error.message);
    return res.status(500).json({ success: false, message: "Échec de l'initialisation du paiement CamPay." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// ÉTAPE 2 — Vérifier statut (polling frontend)
// GET /api/campay/statut/:reference
// ─────────────────────────────────────────────────────────────────────
export const verifierPaiement = async (req, res) => {
  const { reference } = req.params;
  const adminId       = req.user.id;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transaction_paiement WHERE campay_reference = ? AND admin_id = ?`,
      [reference, adminId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Transaction introuvable." });

    const transaction = rows[0];
    if (transaction.statut === "SUCCESSFUL") return res.json({ success: true, status: "SUCCESSFUL" });
    if (transaction.statut === "FAILED")     return res.json({ success: true, status: "FAILED" });

    const campayData = await verifierStatutCampay(reference);

    if (campayData.status === "SUCCESSFUL") {
      const donnees  = JSON.parse(transaction.donnees_election);
      const election = await creerElectionEnDB(donnees, adminId);
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'SUCCESSFUL', date_confirmation = NOW() WHERE campay_reference = ?`,
        [reference]
      );
      return res.json({ success: true, status: "SUCCESSFUL", election });
    }

    if (campayData.status === "FAILED") {
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'FAILED' WHERE campay_reference = ?`, [reference]
      );
    }

    return res.json({ success: true, status: campayData.status });
  } catch (error) {
    console.error("Erreur verifierPaiement:", error.message);
    return res.status(500).json({ success: false, message: "Erreur de vérification." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC — Initier paiement SANS JWT
// POST /api/campay/initier-paiement-public
// ─────────────────────────────────────────────────────────────────────
export const initierPaiementPublic = async (req, res) => {
  const { telephone, user_id, donnees_election } = req.body;

  if (!/^237[0-9]{9}$/.test(telephone))
    return res.status(400).json({ success: false, message: "Numéro invalide. Format attendu : 237XXXXXXXXX" });
  if (!user_id)
    return res.status(400).json({ success: false, message: "user_id manquant." });
  if (!donnees_election?.titre)
    return res.status(400).json({ success: false, message: "Les données de l'élection sont manquantes." });

  try {
    const paiement = await initierCollecte(telephone, user_id);

    await pool.execute(
      `INSERT INTO transaction_paiement
        (admin_id, campay_reference, external_reference, montant, statut, donnees_election, type_transaction)
       VALUES (?, ?, ?, ?, 'PENDING', ?, 'CREATION_ELECTION')`,
      [user_id, paiement.campay_reference, paiement.external_reference, paiement.montant, JSON.stringify(donnees_election)]
    );

    return res.status(200).json({
      success: true,
      campay_reference: paiement.campay_reference,
      ussd_code:        paiement.ussd_code,
      montant:          paiement.montant,
      message:          "Vérifiez votre téléphone et confirmez le paiement avec votre PIN.",
    });
  } catch (error) {
    console.error("Erreur initierPaiementPublic:", error.message);
    return res.status(500).json({ success: false, message: "Échec de l'initialisation du paiement CamPay." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC — Vérifier statut SANS JWT
// GET /api/campay/statut-public/:reference
// ─────────────────────────────────────────────────────────────────────
export const verifierPaiementPublic = async (req, res) => {
  const { reference } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transaction_paiement WHERE campay_reference = ?`, [reference]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Transaction introuvable." });

    const transaction = rows[0];
    if (transaction.statut === "SUCCESSFUL") return res.json({ success: true, status: "SUCCESSFUL" });
    if (transaction.statut === "FAILED")     return res.json({ success: true, status: "FAILED" });

    const campayData = await verifierStatutCampay(reference);

    if (campayData.status === "SUCCESSFUL") {
      const donnees = JSON.parse(transaction.donnees_election);
      await creerElectionEnDB(donnees, transaction.admin_id);
      await pool.execute(
        `UPDATE utilisateur SET role = 'ADMIN_ELECTION', actif = 1 WHERE id = ?`, [transaction.admin_id]
      );
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'SUCCESSFUL', date_confirmation = NOW() WHERE campay_reference = ?`,
        [reference]
      );
      return res.json({ success: true, status: "SUCCESSFUL" });
    }

    if (campayData.status === "FAILED") {
      await pool.execute(
        `UPDATE transaction_paiement SET statut = 'FAILED' WHERE campay_reference = ?`, [reference]
      );
      return res.json({ success: true, status: "FAILED" });
    }

    return res.json({ success: true, status: campayData.status });
  } catch (error) {
    console.error("Erreur verifierPaiementPublic:", error.message);
    return res.status(500).json({ success: false, message: "Erreur de vérification." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// WEBHOOK — CamPay notifie automatiquement
// ─────────────────────────────────────────────────────────────────────
export const webhook = async (req, res) => {
  const { reference, status } = req.body;
  console.log("📩 Webhook CamPay reçu:", req.body);

  try {
    if (status === "SUCCESSFUL") {
      const [rows] = await pool.execute(
        `SELECT * FROM transaction_paiement WHERE campay_reference = ? AND statut = 'PENDING'`,
        [reference]
      );
      if (rows.length > 0) {
        const transaction = rows[0];
        const donnees     = JSON.parse(transaction.donnees_election);
        await creerElectionEnDB(donnees, transaction.admin_id);
        await pool.execute(
          `UPDATE utilisateur SET role = 'ADMIN_ELECTION', actif = 1 WHERE id = ?`, [transaction.admin_id]
        );
        await pool.execute(
          `UPDATE transaction_paiement SET statut = 'SUCCESSFUL', date_confirmation = NOW() WHERE campay_reference = ?`,
          [reference]
        );
      }
    }
  } catch (err) {
    console.error("Erreur webhook:", err.message);
  }
  return res.status(200).json({ received: true });
};

// ─────────────────────────────────────────────────────────────────────
// RETRAIT — Super admin initie un virement sortant
// POST /api/campay/initier-retrait
// ─────────────────────────────────────────────────────────────────────
export const initierRetrait = async (req, res) => {
  const superAdminId = req.user.id;
  const { telephone, montant, description } = req.body;

  if (!/^237[0-9]{9}$/.test(telephone)) {
    return res.status(400).json({ success: false, message: "Numéro invalide. Format attendu : 237XXXXXXXXX" });
  }
  const montantNum = Number(montant);
  if (!montantNum || montantNum < 100) {
    return res.status(400).json({ success: false, message: "Montant invalide. Minimum : 100 XAF." });
  }

  try {
    // FIX : initierTransfert est maintenant correctement importé en haut du fichier
    const transfert = await initierTransfert({ telephone, montant: montantNum, description });

    await pool.execute(
      `INSERT INTO transaction_retrait
        (superadmin_id, campay_reference, external_reference, montant, telephone, description, statut)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [superAdminId, transfert.campay_reference, transfert.external_reference, montantNum, telephone, description || null]
    );

    return res.status(200).json({
      success:          true,
      campay_reference: transfert.campay_reference,
      montant:          montantNum,
      message:          "Retrait initié. Confirmation dans quelques instants.",
    });
  } catch (error) {
    console.error("Erreur initierRetrait:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Échec de l'initialisation du retrait CamPay." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// RETRAIT — Vérifier statut
// GET /api/campay/statut-retrait/:reference
// ─────────────────────────────────────────────────────────────────────
export const verifierRetrait = async (req, res) => {
  const { reference } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transaction_retrait WHERE campay_reference = ?`, [reference]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Retrait introuvable." });

    const retrait = rows[0];
    if (retrait.statut !== "PENDING") return res.json({ success: true, status: retrait.statut });

    // ── Mode DÉMO : référence simulée → marquer SUCCESSFUL directement ──
    if (reference.startsWith("DEMO-RETRAIT-")) {
      await pool.execute(
        `UPDATE transaction_retrait SET statut = 'SUCCESSFUL', date_confirmation = NOW() WHERE campay_reference = ?`,
        [reference]
      );
      return res.json({ success: true, status: "SUCCESSFUL" });
    }

    // ── Mode PRODUCTION : vérifier auprès de CamPay ──
    const campayData = await verifierStatutCampay(reference);

    if (campayData.status === "SUCCESSFUL") {
      await pool.execute(
        `UPDATE transaction_retrait SET statut = 'SUCCESSFUL', date_confirmation = NOW() WHERE campay_reference = ?`,
        [reference]
      );
    } else if (campayData.status === "FAILED") {
      await pool.execute(
        `UPDATE transaction_retrait SET statut = 'FAILED' WHERE campay_reference = ?`, [reference]
      );
    }

    return res.json({ success: true, status: campayData.status });
  } catch (error) {
    console.error("Erreur verifierRetrait:", error.message);
    return res.status(500).json({ success: false, message: "Erreur de vérification." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// SUPER ADMIN — Lister tous les retraits
// GET /api/campay/retraits
// ─────────────────────────────────────────────────────────────────────
export const listerRetraits = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.nom AS superadmin_nom, u.prenom AS superadmin_prenom, u.email AS superadmin_email
       FROM transaction_retrait r
       LEFT JOIN utilisateur u ON u.id = r.superadmin_id
       ORDER BY r.date_creation DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erreur listerRetraits:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// SUPER ADMIN — Toutes les transactions (créations + votes publics)
// GET /api/superadmin/transactions-campay
// ─────────────────────────────────────────────────────────────────────
export const listerToutesTransactions = async (req, res) => {
  try {
    // Transactions de création d'élection
    const [creations] = await pool.execute(`
      SELECT
        tp.id_transaction,
        tp.campay_reference,
        tp.external_reference,
        tp.montant,
        tp.statut,
        tp.date_creation,
        tp.date_confirmation,
        tp.donnees_election,
        'CREATION_ELECTION'        AS type_transaction,
        'Frais de création'        AS type_label,
        u.nom                      AS admin_nom,
        u.prenom                   AS admin_prenom,
        u.email                    AS admin_email,
        NULL                       AS election_titre,
        NULL                       AS candidat_nom,
        NULL                       AS candidat_prenom,
        NULL                       AS telephone_electeur
      FROM transaction_paiement tp
      LEFT JOIN utilisateur u ON u.id = tp.admin_id
      ORDER BY tp.date_creation DESC
    `);

    // Transactions de votes publics
    const [votes] = await pool.execute(`
      SELECT
        vp.id                      AS id_transaction,
        vp.campay_reference,
        NULL                       AS external_reference,
        e.frais_vote_xaf           AS montant,
        vp.statut_paiement         AS statut,
        vp.created_at              AS date_creation,
        NULL                       AS date_confirmation,
        NULL                       AS donnees_election,
        'VOTE_PUBLIC'              AS type_transaction,
        'Vote élection publique'   AS type_label,
        u.nom                      AS admin_nom,
        u.prenom                   AS admin_prenom,
        u.email                    AS admin_email,
        e.titre                    AS election_titre,
        cp.nom                     AS candidat_nom,
        cp.prenom                  AS candidat_prenom,
        vp.telephone_electeur
      FROM vote_public vp
      JOIN election        e  ON e.id_election       = vp.election_id
      JOIN candidat_public cp ON cp.id               = vp.candidat_public_id
      LEFT JOIN utilisateur u ON u.id                = e.admin_id
      ORDER BY vp.created_at DESC
    `);

    // Normaliser les statuts des votes (PAYÉ → SUCCESSFUL, ECHEC → FAILED, EN_ATTENTE → PENDING)
    const votesNormalized = votes.map(v => ({
      ...v,
      statut: v.statut === 'PAYÉ' ? 'SUCCESSFUL' : v.statut === 'ECHEC' ? 'FAILED' : 'PENDING',
    }));

    // Fusionner et trier par date décroissante
    const toutes = [...creations, ...votesNormalized].sort(
      (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
    );

    return res.json(toutes);
  } catch (error) {
    console.error("Erreur listerToutesTransactions:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────────────
// Utilitaire interne — crée election + scrutin en DB
// ─────────────────────────────────────────────────────────────────────
async function creerElectionEnDB(donnees, adminId) {
  const { titre, description = "", startDate, endDate, type = "UNINOMINAL", dureeTourMinutes, nbSieges } = donnees;
  const isListe = type === "LISTE";

  const toLocalMySQL = (d) => {
    const date = new Date(d);
    const pad  = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  };

  const dateDebut = toLocalMySQL(new Date(startDate));
  const dateFin   = isListe
    ? toLocalMySQL(new Date(new Date(startDate).getTime() + (dureeTourMinutes || 1440) * 60000))
    : toLocalMySQL(new Date(endDate));

  const [result] = await pool.execute(
    `INSERT INTO election (titre, description, date_debut, date_fin, statut, admin_id, tour_courant, nb_sieges, duree_tour_minutes)
     VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, 1, ?, ?)`,
    [titre, description, dateDebut, dateFin, adminId, isListe ? (nbSieges || 0) : 0, isListe ? (dureeTourMinutes || 1440) : 1440]
  );

  const electionId = result.insertId;
  await pool.execute(`INSERT INTO scrutin (type, election_id) VALUES (?, ?)`, [type, electionId]);
  return { id_election: electionId, titre, statut: "EN_ATTENTE" };
}