
// ══════════════════════════════════════════════════════════════
// backend/routes/superadmin_transactions.routes.js
// ══════════════════════════════════════════════════════════════
import express from "express";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";
import {
  getTransactionsCamPay,
  getStatsCamPay,
} from "../controllers/superadmin_transactions.controller.js";

const router = express.Router();

// Toutes les routes sont protégées : JWT + rôle SUPER_ADMIN
router.get("/",       verifyToken, isSuperAdmin, getTransactionsCamPay);
router.get("/stats",  verifyToken, isSuperAdmin, getStatsCamPay);

export default router;
