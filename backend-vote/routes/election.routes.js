// src/routes/election.routes.js
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
import { getElectionDetails } from "../controllers/electionDetails.controller.js";

import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ================= SUPER ADMIN =================
// ⚠️ Ces routes DOIVENT être avant /:id sinon Express croit que "pending" est un ID
router.get("/pending",        verifyToken, isSuperAdmin, getPendingElections);
router.put("/approve/:id",    verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
router.put("/reject/:id",     verifyToken, isSuperAdmin, rejectElection);

// ================= ADMIN =================
router.post("/submit",        verifyToken, isAdmin, submitElectionForValidation);
router.get("/",               verifyToken, isAdmin, getAdminElections);

// ✅ CORRIGÉ : route PUT sur /update/:id (cohérente avec le frontend)
router.put("/update/:id",     verifyToken, isAdmin, updateElection);
router.delete("/delete/:id",  verifyToken, isAdmin, deleteElection);

// ⚠️ Toujours en DERNIER pour ne pas capturer les routes nommées ci-dessus
router.get("/:id",            verifyToken, isAdmin, getElectionById);
router.get("/details/:id", verifyToken, isAdmin, getElectionDetails);

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
// router.get("/pending",        verifyToken, isSuperAdmin, getPendingElections);
// router.put("/approve/:id",    verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
// router.put("/reject/:id",     verifyToken, isSuperAdmin, rejectElection);

// // ================= ADMIN =================
// router.post("/submit",        verifyToken, isAdmin, submitElectionForValidation);
// router.get("/",               verifyToken, isAdmin, getAdminElections);

// // ✅ CORRIGÉ : route PUT sur /update/:id (cohérente avec le frontend)
// router.put("/update/:id",     verifyToken, isAdmin, updateElection);
// router.delete("/delete/:id",  verifyToken, isAdmin, deleteElection);

// // ⚠️ Toujours en DERNIER pour ne pas capturer les routes nommées ci-dessus
// router.get("/:id",            verifyToken, isAdmin, getElectionById);

// export default router;



