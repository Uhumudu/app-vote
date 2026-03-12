// backend/routes/candidat.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getCandidatsByElection,
  createCandidat,
  updateCandidat,
  deleteCandidat,
  importCandidatsCSV,
  getListesByElection,
   deleteListe
} from "../controllers/candidat.controller.js";

const router = express.Router();

// GET    /api/elections/:electionId/candidats        → liste candidats
// POST   /api/elections/:electionId/candidats        → ajouter candidat
// POST   /api/elections/:electionId/candidats/import → import CSV
// GET    /api/elections/:electionId/listes           → liste des listes
// PUT    /api/candidats/:id                          → modifier candidat
// DELETE /api/candidats/:id                          → supprimer candidat

router.get("/elections/:electionId/candidats",         verifyToken, isAdmin, getCandidatsByElection);
router.post("/elections/:electionId/candidats",        verifyToken, isAdmin, createCandidat);
router.post("/elections/:electionId/candidats/import", verifyToken, isAdmin, importCandidatsCSV);
router.get("/elections/:electionId/listes",            verifyToken, isAdmin, getListesByElection);
router.put("/candidats/:id",                           verifyToken, isAdmin, updateCandidat);
router.delete("/candidats/:id",                        verifyToken, isAdmin, deleteCandidat);
router.delete("/listes/:listeId", verifyToken, isAdmin, deleteListe);

export default router;
