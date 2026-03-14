// backend/routes/election.routes.js
import express from "express";
import { 
  submitElectionForValidation,
  updateElection,
  deleteElection,
  getAdminElections,
  getElectionById,
  rejectElection,
  getPendingElections,
  approveElectionAndPromoteAdmin,
} from "../controllers/election.controller.js";

// ✅ Ajouter cet import
import { cloturerTour } from "../controllers/scrutinListe.controller.js";

import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── SUPER ADMIN ───────────────────────────────────────────────────────────────
router.get("/pending",       verifyToken, isSuperAdmin, getPendingElections);
router.put("/approve/:id",   verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
router.put("/reject/:id",    verifyToken, isSuperAdmin, rejectElection);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.post("/submit",       verifyToken, isAdmin, submitElectionForValidation);
router.get("/",              verifyToken, isAdmin, getAdminElections);
router.put("/update/:id",    verifyToken, isAdmin, updateElection);
router.delete("/delete/:id", verifyToken, isAdmin, deleteElection);

// ✅ AVANT /:id obligatoirement
router.post("/:id/cloturer-tour", verifyToken, isAdmin, cloturerTour);

router.get("/:id",           verifyToken, isAdmin, getElectionById); // ← toujours en DERNIER

export default router;
































// // src/routes/election.routes.js
// import express from "express";
// import { 
//   submitElectionForValidation,
//   updateElection,
//   deleteElection,
//   getAdminElections,
//   getElectionById,
//   rejectElection,
//   getPendingElections,
//   approveElectionAndPromoteAdmin,
// } from "../controllers/election.controller.js";

// import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// // ================= SUPER ADMIN =================
// // ⚠️ Ces routes DOIVENT être avant /:id sinon Express croit que "pending" est un ID
// router.get("/pending", verifyToken, isSuperAdmin, getPendingElections);
// router.put("/approve/:id", verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
// router.put("/reject/:id", verifyToken, isSuperAdmin, rejectElection);

// // ================= ADMIN =================
// router.post("/submit", verifyToken, isAdmin, submitElectionForValidation);
// router.get("/", verifyToken, isAdmin, getAdminElections);
// router.put("/update/:id", verifyToken, isAdmin, updateElection);
// router.delete("/delete/:id", verifyToken, isAdmin, deleteElection);
// router.get("/:id", verifyToken, isAdmin, getElectionById); // ← toujours en DERNIER

// export default router;


