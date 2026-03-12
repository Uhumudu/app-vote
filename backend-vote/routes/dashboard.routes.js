// backend/routes/dashboard.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

// GET /api/dashboard/stats → statistiques du tableau de bord
router.get("/dashboard/stats", verifyToken, isAdmin, getDashboardStats);

export default router;
