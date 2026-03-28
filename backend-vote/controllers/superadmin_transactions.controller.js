// ══════════════════════════════════════════════════════════════
// backend/controllers/transactionsCampay.controller.js
// ══════════════════════════════════════════════════════════════
import { pool } from "../config/db.js";

// ─── GET /api/superadmin/transactions-campay ──────────────────
// Retourne toutes les transactions CamPay avec les infos admin
export const getTransactionsCamPay = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        tp.id_transaction,
        tp.campay_reference,
        tp.external_reference,
        tp.montant,
        tp.statut,
        tp.donnees_election,
        tp.date_creation,
        tp.date_confirmation,
        u.id          AS admin_id,
        u.nom         AS admin_nom,
        u.prenom      AS admin_prenom,
        u.email       AS admin_email
      FROM transaction_paiement tp
      LEFT JOIN utilisateur u ON u.id = tp.admin_id
      ORDER BY tp.date_creation DESC
    `);

    return res.json(rows);
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

