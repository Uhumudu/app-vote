// backend/routes/publicElection.routes.js
import express from "express";
import {
  getPublicElections,
  getPublicElectionDetail,
  submitPublicCandidature,
  initiatePublicVote,
  checkPublicVoteStatus,
  getCandidatDashboard,
  getElecteurDashboard,
  getPublicCandidatures,
  reviewPublicCandidature,
} from "../controllers/publicElection.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Routes PUBLIQUES (sans token) ──────────────────────────────────────────
// Liste des élections publiques (page d'accueil)
router.get("/",                               getPublicElections);

// Détail d'une élection + ses candidats (aussi utilisé par ResultatsPublicPage)
router.get("/:id/detail",                     getPublicElectionDetail);

// Déposer une candidature sans compte
router.post("/:id/candidater",                submitPublicCandidature);

// Voter (paiement CamPay)
router.post("/:id/voter",                     initiatePublicVote);

// Vérifier le statut du paiement (polling)
router.get("/vote-statut/:reference",         checkPublicVoteStatus);

// Dashboard candidat public (accès par ID)
router.get("/dashboard/candidat/:candidat_id", getCandidatDashboard);

// Dashboard électeur public (accès par téléphone)
router.get("/dashboard/electeur/:telephone",   getElecteurDashboard);

// ─── Routes ADMIN (token requis) ─────────────────────────────────────────────
// Lister les candidatures de mon élection publique
router.get("/:id/candidatures",               verifyToken, isAdmin, getPublicCandidatures);

// Approuver ou rejeter une candidature
router.put("/candidature/:candidat_id/review", verifyToken, isAdmin, reviewPublicCandidature);

export default router;
