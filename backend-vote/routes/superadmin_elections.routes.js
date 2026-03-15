// backend/routes/superadmin_elections.routes.js
import express from "express";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";
import {
  getAllElections,
  createElectionSuperAdmin,
  updateElectionSuperAdmin,
  deleteElectionSuperAdmin,
  changeElectionAdmin,
} from "../controllers/superadmin_elections.controller.js";

const router = express.Router();

// Toutes les élections du système
router.get("/superadmin/elections",              verifyToken, isSuperAdmin, getAllElections);

// Créer une élection (avec affectation admin)
router.post("/superadmin/elections",             verifyToken, isSuperAdmin, createElectionSuperAdmin);

// Modifier une élection
router.put("/superadmin/elections/:id",          verifyToken, isSuperAdmin, updateElectionSuperAdmin);

// Supprimer une élection (tous statuts pour le super admin)
router.delete("/superadmin/elections/:id",       verifyToken, isSuperAdmin, deleteElectionSuperAdmin);

// Changer l'admin d'une élection
router.put("/superadmin/elections/:id/admin",    verifyToken, isSuperAdmin, changeElectionAdmin);

export default router;
