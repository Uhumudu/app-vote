// routes/superAdminSettings.routes.js
import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getRoles,
  getPlatformConfig,
  updatePlatformConfig,
  getLogs,
  exportLogs,
} from "../controllers/superAdminSettings.controller.js";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.use(isSuperAdmin);

// ── Utilisateurs ──────────────────────────────────────────────────────────────
router.get("/users",              getUsers);
router.post("/users",             createUser);
router.put("/users/:id",          updateUser);
router.patch("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id",       deleteUser);

// ── Rôles ─────────────────────────────────────────────────────────────────────
router.get("/roles",              getRoles);

// ── Plateforme ────────────────────────────────────────────────────────────────
router.get("/platform",           getPlatformConfig);
router.put("/platform",           updatePlatformConfig);

// ── Logs ──────────────────────────────────────────────────────────────────────
router.get("/logs/export",        exportLogs);   // avant /logs pour éviter le conflit
router.get("/logs",               getLogs);

export default router;
