// backend/routes/dashsuper.routes.js
import express from "express";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";
import { getSuperAdminStats } from "../controllers/dashsuper.controller.js";

const router = express.Router();

// GET /api/superadmin/stats
router.get("/superadmin/stats", verifyToken, isSuperAdmin, getSuperAdminStats);

export default router;