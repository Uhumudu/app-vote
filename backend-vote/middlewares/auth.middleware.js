// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_votage_2026_secure";
//"secret_super_votage

// Vérifie que l'utilisateur est connecté
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Non autorisé" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contient id et role
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

// Vérifie que l'utilisateur est ADMIN_ELECTION
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN_ELECTION") {
    return res.status(403).json({ message: "Accès refusé, admin uniquement" });
  }
  next();
};




// export const isAdmin = (req, res, next) => {
//   if (!req.user || req.user.role !== "ADMIN_ELECTION") {
//     return res.status(403).json({ message: "Accès refusé, admin uniquement" });
//   }
//   next();
// };

// Vérifie que l'utilisateur est SUPER_ADMIN
export const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Accès refusé, super admin uniquement" });
  }
  next();
};

