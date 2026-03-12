// backend/routes/utilisateurs.routes.js
import express from "express";
import {
  getUtilisateurs,
  getUtilisateurById,
  addUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
} from "../controllers/utilisateurs.controller.js";

const router = express.Router();

// 🔹 Routes CRUD
router.get("/", getUtilisateurs);
router.get("/:id", getUtilisateurById);
router.post("/", addUtilisateur);
router.put("/:id", updateUtilisateur);
router.delete("/:id", deleteUtilisateur);

export default router;
