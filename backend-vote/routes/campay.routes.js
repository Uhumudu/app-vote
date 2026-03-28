import express              from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  initierPaiement,
  verifierPaiement,
  initierPaiementPublic,
  verifierPaiementPublic,
  webhook,
} from "../controllers/campay.controller.js";

const router = express.Router();

// ── Routes protégées (admin déjà connecté) ──
router.post("/initier-paiement",   verifyToken, isAdmin, initierPaiement);
router.get("/statut/:reference",   verifyToken, isAdmin, verifierPaiement);

// ── Routes publiques (inscription en cours, pas de JWT) ──
router.post("/initier-paiement-public",      initierPaiementPublic);
router.get("/statut-public/:reference",      verifierPaiementPublic);

// ── Webhook CamPay (appelé par CamPay, pas d'auth) ──
router.post("/webhook", webhook);

export default router;


























// import express              from "express";
// import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
// import {
//   initierPaiement,
//   verifierPaiement,
//   webhook,
// } from "../controllers/campay.controller.js";

// const router = express.Router();

// // Routes protégées (ADMIN_ELECTION connecté)
// router.post("/initier-paiement", verifyToken, isAdmin, initierPaiement);
// router.get("/statut/:reference", verifyToken, isAdmin, verifierPaiement);

// // ✅ Routes PUBLIQUES (utilisateur pas encore connecté)
// router.post("/initier-paiement-public", initierPaiementPublic);
// router.get("/statut-public/:reference", verifierPaiementPublic);

// // Webhook CamPay — PAS d'auth JWT (appelé par CamPay)
// router.post("/webhook", webhook);

// export default router;