// ══════════════════════════════════════════════════════════════
// backend/controllers/transactionsCampay.controller.js
// ══════════════════════════════════════════════════════════════
import { pool } from "../config/db.js";

// ─── GET /api/superadmin/transactions-campay ──────────────────
// Retourne toutes les transactions CamPay avec les infos admin
export const getTransactionsCamPay = async (req, res) => {
  try {
    // ── Créations d'élections ──────────────────────────────────
    const [creations] = await pool.execute(`
      SELECT
        tp.id_transaction,
        tp.campay_reference,
        tp.external_reference,
        tp.montant,
        tp.statut,
        tp.donnees_election,
        tp.date_creation,
        tp.date_confirmation,
        'CREATION_ELECTION'      AS type_transaction,
        'Frais de création'      AS type_label,
        u.nom                    AS admin_nom,
        u.prenom                 AS admin_prenom,
        u.email                  AS admin_email,
        NULL                     AS election_titre,
        NULL                     AS candidat_nom,
        NULL                     AS candidat_prenom,
        NULL                     AS telephone_electeur
      FROM transaction_paiement tp
      LEFT JOIN utilisateur u ON u.id = tp.admin_id
    `);

    // ── Votes publics ──────────────────────────────────────────
    const [votes] = await pool.execute(`
      SELECT
        vp.id                    AS id_transaction,
        vp.campay_reference,
        NULL                     AS external_reference,
        e.frais_vote_xaf         AS montant,
        vp.statut_paiement       AS statut,
        NULL                     AS donnees_election,
        vp.created_at            AS date_creation,
        NULL                     AS date_confirmation,
        'VOTE_PUBLIC'            AS type_transaction,
        'Vote élection publique' AS type_label,
        u.nom                    AS admin_nom,
        u.prenom                 AS admin_prenom,
        u.email                  AS admin_email,
        e.titre                  AS election_titre,
        cp.nom                   AS candidat_nom,
        cp.prenom                AS candidat_prenom,
        vp.telephone_electeur
      FROM vote_public vp
      JOIN election        e  ON e.id_election       = vp.election_id
      JOIN candidat_public cp ON cp.id               = vp.candidat_public_id
      LEFT JOIN utilisateur u ON u.id                = e.admin_id
    `);

    // Normaliser statuts votes → SUCCESSFUL / FAILED / PENDING
    const votesNormalized = votes.map(v => ({
      ...v,
      statut: v.statut === 'PAYÉ' ? 'SUCCESSFUL'
            : v.statut === 'ECHEC' ? 'FAILED'
            : 'PENDING',
    }));

    // Fusionner et trier par date décroissante
    const toutes = [...creations, ...votesNormalized].sort(
      (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
    );

    return res.json(toutes);
  } catch (error) {
    console.error("❌ Erreur getTransactionsCamPay:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/superadmin/transactions-campay/stats ────────────
// KPIs agrégés pour le dashboard Super Admin
export const getStatsCamPay = async (req, res) => {
  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM transaction_paiement`
    );

    const [[{ succes }]] = await pool.execute(
      `SELECT COUNT(*) AS succes FROM transaction_paiement WHERE statut = 'SUCCESSFUL'`
    );

    const [[{ echecs }]] = await pool.execute(
      `SELECT COUNT(*) AS echecs FROM transaction_paiement WHERE statut = 'FAILED'`
    );

    const [[{ pending }]] = await pool.execute(
      `SELECT COUNT(*) AS pending FROM transaction_paiement WHERE statut = 'PENDING'`
    );

    const [[{ montantTotal }]] = await pool.execute(
      `SELECT COALESCE(SUM(montant), 0) AS montantTotal
       FROM transaction_paiement WHERE statut = 'SUCCESSFUL'`
    );

    // Évolution mensuelle sur 6 mois
    const [evolution] = await pool.execute(`
      SELECT
        MONTH(date_creation)  AS num_mois,
        YEAR(date_creation)   AS annee,
        COUNT(*)              AS nb_transactions,
        SUM(CASE WHEN statut = 'SUCCESSFUL' THEN montant ELSE 0 END) AS montant_collecte
      FROM transaction_paiement
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(date_creation), MONTH(date_creation)
      ORDER BY annee ASC, num_mois ASC
    `);

    return res.json({
      total:        Number(total),
      succes:       Number(succes),
      echecs:       Number(echecs),
      pending:      Number(pending),
      montantTotal: Number(montantTotal),
      tauxSucces:   Number(total) > 0 ? Math.round((Number(succes) / Number(total)) * 100) : 0,
      evolution:    evolution.map(e => ({
        num_mois:         Number(e.num_mois),
        annee:            Number(e.annee),
        nb_transactions:  Number(e.nb_transactions),
        montant_collecte: Number(e.montant_collecte),
      })),
    });
  } catch (error) {
    console.error("❌ Erreur getStatsCamPay:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

