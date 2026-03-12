// backend/routes/statistiques.routes.js
import express from "express";
import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";
import { getStatistiquesGlobales } from "../controllers/statistiques.controller.js";

const router = express.Router();

// GET /api/statistiques  → superadmin uniquement
router.get("/statistiques", verifyToken, isSuperAdmin, getStatistiquesGlobales);

export default router;