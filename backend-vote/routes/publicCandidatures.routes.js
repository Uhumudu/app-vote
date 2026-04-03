// backend/routes/publicCandidatures.routes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getPublicElectionDetail,
  soumettreCandidat,
  getCandidaturesPubliques,
  reviewCandidature,
} from "../controllers/publicCandidatures.controller.js";

const router = express.Router();

// Sans auth — page publique
router.get("/:id/detail",      getPublicElectionDetail);
router.post("/:id/candidater", soumettreCandidat);

// Avec auth — admin seulement
router.get("/:id/candidatures",                       verifyToken, isAdmin, getCandidaturesPubliques);
router.put("/:id/candidatures/:candidatId/review",    verifyToken, isAdmin, reviewCandidature);

export default router;