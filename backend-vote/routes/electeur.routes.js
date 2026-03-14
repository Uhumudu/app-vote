// backend/routes/electeur.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getElecteursByElection,
  addElecteur,
  updateElecteur,
  removeElecteur,
  importElecteursCSV,
  resetPasswordElecteur,
  getElecteurElections,
  getElectionDetail,
  getCandidatsElection,
  getListesElection,
  voterElection,
} from "../controllers/electeur.controller.js";
import { voterListe } from "../controllers/scrutinListe.controller.js";

const router = express.Router();

// ── ROUTES ADMIN ──────────────────────────────────────────────────────────────
router.get("/elections/:electionId/electeurs",                verifyToken, isAdmin, getElecteursByElection);
router.post("/elections/:electionId/electeurs",               verifyToken, isAdmin, addElecteur);
router.post("/elections/:electionId/electeurs/import",        verifyToken, isAdmin, importElecteursCSV);
router.put("/elections/:electionId/electeurs/:electeurId",    verifyToken, isAdmin, updateElecteur);
router.delete("/elections/:electionId/electeurs/:electeurId", verifyToken, isAdmin, removeElecteur);
router.post("/electeurs/:electeurId/reset-password",          verifyToken, isAdmin, resetPasswordElecteur);

// ── ROUTES ELECTEUR ───────────────────────────────────────────────────────────
router.get("/electeur/elections",                             verifyToken, getElecteurElections);
router.get("/electeur/elections/:electionId",                 verifyToken, getElectionDetail);
router.get("/electeur/elections/:electionId/candidats",       verifyToken, getCandidatsElection);
router.get("/electeur/elections/:electionId/listes",          verifyToken, getListesElection);
router.post("/elections/:electionId/voter",                   verifyToken, voterElection);

// ✅ verifyToken uniquement — pas isAdmin, c'est l'électeur qui vote
router.post("/elections/:electionId/voter-liste",             verifyToken, voterListe);

export default router;



















// // backend/routes/electeur.routes.js
// import express from "express";
// import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
// import {
//   getElecteursByElection,
//   addElecteur,
//   updateElecteur,
//   removeElecteur,
//   importElecteursCSV,
//   resetPasswordElecteur,
//   getElecteurElections,
//   voterElection
// } from "../controllers/electeur.controller.js";

// const router = express.Router();

// // GET    /api/elections/:electionId/electeurs               → liste électeurs
// // POST   /api/elections/:electionId/electeurs               → ajouter électeur
// // POST   /api/elections/:electionId/electeurs/import        → import CSV
// // PUT    /api/elections/:electionId/electeurs/:electeurId   → modifier électeur
// // DELETE /api/elections/:electionId/electeurs/:electeurId   → retirer électeur
// // POST   /api/electeurs/:electeurId/reset-password          → reset mdp

// router.get("/elections/:electionId/electeurs",                      verifyToken, isAdmin, getElecteursByElection);
// router.post("/elections/:electionId/electeurs",                     verifyToken, isAdmin, addElecteur);
// router.post("/elections/:electionId/electeurs/import",              verifyToken, isAdmin, importElecteursCSV);
// router.put("/elections/:electionId/electeurs/:electeurId",          verifyToken, isAdmin, updateElecteur);
// router.delete("/elections/:electionId/electeurs/:electeurId",       verifyToken, isAdmin, removeElecteur);
// router.post("/electeurs/:electeurId/reset-password",                verifyToken, isAdmin, resetPasswordElecteur);
// router.get("/electeur/elections", verifyToken, getElecteurElections);
// router.post("/elections/:electionId/voter", verifyToken, voterElection);

// export default router;
