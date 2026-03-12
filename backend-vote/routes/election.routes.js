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

import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ================= SUPER ADMIN =================
// ⚠️ Ces routes DOIVENT être avant /:id sinon Express croit que "pending" est un ID
router.get("/pending", verifyToken, isSuperAdmin, getPendingElections);
router.put("/approve/:id", verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
router.put("/reject/:id", verifyToken, isSuperAdmin, rejectElection);

// ================= ADMIN =================
router.post("/submit", verifyToken, isAdmin, submitElectionForValidation);
router.get("/", verifyToken, isAdmin, getAdminElections);
router.put("/update/:id", verifyToken, isAdmin, updateElection);
router.delete("/delete/:id", verifyToken, isAdmin, deleteElection);
router.get("/:id", verifyToken, isAdmin, getElectionById); // ← toujours en DERNIER

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
//   // getElectionResults
// } from "../controllers/election.controller.js";

// import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// // ================= ADMIN =================
// router.post("/submit", verifyToken, isAdmin, submitElectionForValidation);
// router.get("/", verifyToken, isAdmin, getAdminElections);
// router.get("/:id", verifyToken, isAdmin, getElectionById); // Récupérer une élection pour modification
// router.put("/update/:id", verifyToken, isAdmin, updateElection);
// router.delete("/delete/:id", verifyToken, isAdmin, deleteElection);

// // ================= SUPER ADMIN =================
// router.get("/pending", verifyToken, isSuperAdmin, getPendingElections);
// router.put("/approve/:id", verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
// router.put("/reject/:id", verifyToken, isSuperAdmin, rejectElection);

// // ================= RESULTATS =================
// // Si tu veux activer les résultats plus tard
// // router.get("/results/:id", verifyToken, isSuperAdmin, getElectionResults);

// export default router;

































// // src/routes/election.routes.js
// import express from "express";
// import { 
//   submitElectionForValidation,
//   updateElection,
//   deleteElection,
//   getAdminElections,
//   rejectElection,
//   //getElectionResults,
//   getPendingElections,
//   approveElectionAndPromoteAdmin
// } from "../controllers/election.controller.js";

// import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// // ADMIN
// router.post("/submit", verifyToken, isAdmin, submitElectionForValidation);
// router.get("/", verifyToken, isAdmin, getAdminElections);
// router.put("/update/:id", verifyToken, isAdmin, updateElection);
// router.delete("/delete/:id", verifyToken, isAdmin, deleteElection);

// // router.put("/approve/:id", approveElectionAndPromoteAdmin);

// // SUPER ADMIN
// // router.put("/approve/:id", verifyToken, isSuperAdmin, approveElection);
// router.put("/reject/:id", verifyToken, isSuperAdmin, rejectElection);
// //router.get("/results/:id", verifyToken, isSuperAdmin, getElectionResults);
// // router.get("/pending", verifyToken, isSuperAdmin, getPendingElections);
// router.get("/pending", getPendingElections);
// // router.put("/election/approve/:id", verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);
// router.put("/approve/:id", verifyToken, isSuperAdmin, approveElectionAndPromoteAdmin);

// export default router;