// routes/superAdminSettings.routes.js
import express from "express";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";
import {
  getRoles,
  getPlatformConfig,
  updatePlatformConfig,
  getLogs,
  exportLogs,
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../controllers/superAdminSettings.controller.js";

const router = express.Router();

// ─── ROUTE PUBLIQUE (sans token) ─────────────────────────────────────────────
// Utilisée par MaintenancePage et PlatformConfigProvider
router.get("/platform/public", getPlatformConfig);

// ─── ROUTES PROTÉGÉES ────────────────────────────────────────────────────────
router.use(verifyToken, isSuperAdmin);

// Utilisateurs
router.get("/users",              getUsers);
router.post("/users",             createUser);
router.put("/users/:id",          updateUser);
router.patch("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id",       deleteUser);

// Rôles
router.get("/roles", getRoles);

// Plateforme
router.get("/platform", getPlatformConfig);
router.put("/platform", updatePlatformConfig);

// Logs
router.get("/logs",        getLogs);
router.get("/logs/export", exportLogs);

export default router;






























// // routes/superAdminSettings.routes.js
// import express from "express";
// import {
//   getUsers,
//   createUser,
//   updateUser,
//   toggleUserStatus,
//   deleteUser,
//   getRoles,
//   updatePlatformConfig,
//   getLogs,
//   exportLogs,
//  getPlatformConfig,
// } from "../controllers/superAdminSettings.controller.js";
// import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.use(verifyToken);
// router.use(isSuperAdmin);

// // ── Utilisateurs ──────────────────────────────────────────────────────────────
// router.get("/users",              getUsers);
// router.post("/users",             createUser);
// router.put("/users/:id",          updateUser);
// router.patch("/users/:id/toggle", toggleUserStatus);
// router.delete("/users/:id",       deleteUser);

// // ── Rôles ─────────────────────────────────────────────────────────────────────
// router.get("/roles",              getRoles);

// // ── Plateforme ────────────────────────────────────────────────────────────────
// router.get("/platform",           getPlatformConfig);
// router.put("/platform",           updatePlatformConfig);

// // ── Logs ──────────────────────────────────────────────────────────────────────
// router.get("/logs/export",        exportLogs);   // avant /logs pour éviter le conflit
// router.get("/logs",               getLogs);

// router.get("/platform/public", async (req, res) => {
//     // Réutilise getPlatformConfig mais sans vérifier le token
//     // On ne retourne que les champs nécessaires pour la page de maintenance
//     try {
//       const [rows] = await pool.query(
//         `SELECT message FROM notification
//          WHERE utilisateur_id = 0 AND type = 'PLATFORM_CONFIG'
//          ORDER BY id_notification DESC LIMIT 1`
//       );
//       const defaults = {
//         nomPlateforme: "VoteSecure",
//         couleurPrincipale: "#4f46e5",
//         logoUrl: "",
//         maintenance: false,
//         messageMaintenance: "La plateforme est temporairement indisponible pour maintenance.",
//       };
//       if (rows.length === 0) return res.json(defaults);
//       try {
//         const cfg = JSON.parse(rows[0].message);
//         res.json({
//           nomPlateforme:     cfg.nomPlateforme     || defaults.nomPlateforme,
//           couleurPrincipale: cfg.couleurPrincipale || defaults.couleurPrincipale,
//           logoUrl:           cfg.logoUrl           || defaults.logoUrl,
//           maintenance:       !!cfg.maintenance,
//           messageMaintenance: cfg.messageMaintenance || defaults.messageMaintenance,
//         });
//       } catch {
//         res.json(defaults);
//       }
//     } catch (err) {
//       res.status(500).json({ message: "Erreur serveur." });
//     }
//   });

// export default router;
