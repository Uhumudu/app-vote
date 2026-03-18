// routes/adminElectionSettings.routes.js
import express from "express";
import {
  getProfil,
  updateProfil,
  changePassword,
  getNotifications as getNotificationPrefs,
  updateNotifications as updateNotificationPrefs,
} from "../controllers/adminElectionSettings.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware rôle inline — compatible ADMIN_ELECTION et ADMIN_ELECTION_PENDING
const requireAdminElection = (req, res, next) => {
  const role = req.user?.role;
  if (role === "ADMIN_ELECTION" || role === "ADMIN_ELECTION_PENDING") return next();
  return res.status(403).json({ message: "Accès refusé." });
};

router.use(verifyToken);
router.use(requireAdminElection);

router.get("/profil",          getProfil);
router.put("/profil",          updateProfil);
router.put("/password",        changePassword);
router.get("/notifications",   getNotificationPrefs);
router.put("/notifications",   updateNotificationPrefs);

export default router;
