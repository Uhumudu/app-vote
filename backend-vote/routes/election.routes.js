// backend/routes/election.routes.js
import express from "express";
import {
  // ── Publiques (sans auth)
  getElectionsPubliques,
  getElectionPubliqueDetail,
  postulerCandidatPublic,
  inscrireEtVoterPublic,
  // ── Super Admin
  getPendingElections,
  approveElectionAndPromoteAdmin,
  rejectElection,
  updateStatutElection,
  // ── Admin connecté
  submitElectionForValidation,
  getAdminElections,
  getElectionById,
  updateElection,
  deleteElection,
  getElectionResults,
} from "../controllers/election.controller.js";

import { getElectionDetails } from "../controllers/electionDetails.controller.js";
import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// 🌍 ROUTES PUBLIQUES — sans authentification
// ⚠️  Doivent être AVANT toutes les routes authentifiées
//     pour éviter que /:id ne les intercepte
// ═══════════════════════════════════════════════════════════
router.get("/public",                    getElectionsPubliques);
router.get("/public/:id",                getElectionPubliqueDetail);
router.post("/public/:id/candidature",   postulerCandidatPublic);
router.post("/public/:id/voter",         inscrireEtVoterPublic);

// ═══════════════════════════════════════════════════════════
// 🔐 SUPER ADMIN
// ⚠️  Doivent être AVANT /:id pour ne pas être capturées
// ═══════════════════════════════════════════════════════════
router.get("/pending",          verifyToken, isSuperAdmin, getPendingElections);
router.put("/approve/:id",      verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
router.put("/reject/:id",       verifyToken, isSuperAdmin, rejectElection);
router.put("/statut/:id",       verifyToken, isSuperAdmin, updateStatutElection);

// ═══════════════════════════════════════════════════════════
// 👤 ADMIN ELECTION — connecté
// ═══════════════════════════════════════════════════════════
router.post("/submit",          verifyToken, isAdmin, submitElectionForValidation);
router.get("/",                 verifyToken, isAdmin, getAdminElections);
router.put("/update/:id",       verifyToken, isAdmin, updateElection);
router.delete("/delete/:id",    verifyToken, isAdmin, deleteElection);
router.get("/results/:id",      verifyToken, isAdmin, getElectionResults);
router.get("/details/:id",      verifyToken, isAdmin, getElectionDetails);

// ⚠️  TOUJOURS EN DERNIER — sinon /:id capture tout ce qui précède
router.get("/:id",              verifyToken, isAdmin, getElectionById);

export default router;
