// backend/routes/scrutin_liste.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  voterListe,
  depouiller,
  fusionnerListes,
  getResultatsTours,
  getEtatTour,
} from "../controllers/scrutin_liste.controller.js";

const router = express.Router();

// ── ELECTEUR ──────────────────────────────────────────────────────────────────
// Voter pour une liste (tour courant)
router.post("/elections/:electionId/voter-liste",      verifyToken, voterListe);

// État du tour courant (numéro de tour, listes actives, a_vote_ce_tour)
router.get("/elections/:electionId/etat-tour",         verifyToken, getEtatTour);

// Résultats détaillés par tour (accessible admin + électeur)
router.get("/elections/:electionId/resultats-tours",   verifyToken, getResultatsTours);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
// Clore un tour et calculer les résultats
router.post("/elections/:electionId/depouiller",       verifyToken, isAdmin, depouiller);

// Fusionner deux listes entre deux tours
router.post("/elections/:electionId/fusionner-listes", verifyToken, isAdmin, fusionnerListes);

export default router;
