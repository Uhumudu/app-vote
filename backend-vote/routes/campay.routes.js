import express              from "express";
import { verifyToken, isAdmin, isSuperAdmin } from "../middlewares/auth.middleware.js";
import {
  initierPaiement,
  verifierPaiement,
  initierPaiementPublic,
  verifierPaiementPublic,
  initierRetrait,
  verifierRetrait,
  listerRetraits,
  webhook,
} from "../controllers/campay.controller.js";

const router = express.Router();

// ── Routes protégées (admin déjà connecté) ──
router.post("/initier-paiement",         verifyToken, isAdmin,      initierPaiement);
router.get("/statut/:reference",         verifyToken, isAdmin,      verifierPaiement);

// ── Routes publiques (inscription en cours, pas de JWT) ──
router.post("/initier-paiement-public",  initierPaiementPublic);
router.get("/statut-public/:reference",  verifierPaiementPublic);

// ── Routes super admin (retrait) ──
router.post("/initier-retrait",          verifyToken, isSuperAdmin, initierRetrait);
router.get("/statut-retrait/:reference", verifyToken, isSuperAdmin, verifierRetrait);
router.get("/retraits",                  verifyToken, isSuperAdmin, listerRetraits);

// ── Webhook CamPay (appelé par CamPay, pas d'auth) ──
router.post("/webhook", webhook);

export default router;