// backend/routes/resultat.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import { getResultatsElection, getResultatsAdmin } from "../controllers/resultat.controller.js";

const router = express.Router();

// GET /api/elections/:electionId/resultats  → résultats d'une élection
// GET /api/resultats                        → résultats de toutes les élections de l'admin

router.get("/elections/:electionId/resultats", verifyToken, getResultatsElection);
router.get("/resultats",                       verifyToken, isAdmin, getResultatsAdmin);

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/dashboard.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Séparez dans un fichier dashboard.routes.js si vous préférez,
// ou copiez directement dans votre fichier de routes existant.

// import express from "express";
// import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
// import { getDashboardStats } from "../controllers/dashboard.controller.js";
//
// const router = express.Router();
// router.get("/dashboard/stats", verifyToken, isAdmin, getDashboardStats);
// export default router;
