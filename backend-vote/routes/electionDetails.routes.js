// backend/routes/ElectionDetails.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  creerListe,
  getListes,
  modifierListe,
  supprimerListe,
} from "../controllers/liste.controller.js";

const router = express.Router();

router.get("/:electionId/listes",              verifyToken, isAdmin, getListes);
router.post("/:electionId/listes",             verifyToken, isAdmin, creerListe);
router.put("/:electionId/listes/:listeId",     verifyToken, isAdmin, modifierListe);
router.delete("/:electionId/listes/:listeId",  verifyToken, isAdmin, supprimerListe);

export default router;