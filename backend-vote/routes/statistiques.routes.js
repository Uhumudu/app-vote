// routes/statistiques.routes.js
import express from "express";
import {
  getKpis,
  getElectionsParStatut,
  getUtilisateursParRole,
  getInscriptionsMensuelles,
  getElectionsDetail,
  getAlertes,
  exportCSV,
} from "../controllers/statistiques.controller.js";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.use(isSuperAdmin);

// KPIs globaux
router.get("/kpis",                    getKpis);

// Données graphiques
router.get("/elections-par-statut",    getElectionsParStatut);
router.get("/utilisateurs-par-role",   getUtilisateursParRole);
router.get("/inscriptions-mensuelles", getInscriptionsMensuelles);

// Tableau détaillé
router.get("/elections-detail",        getElectionsDetail);

// Alertes automatiques
router.get("/alertes",                 getAlertes);

// Export CSV — avant toute route générique
router.get("/export-csv",              exportCSV);

export default router;
