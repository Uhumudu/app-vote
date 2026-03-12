// createUsers.js
import bcrypt from "bcryptjs";
import { pool } from "./config/db.js"; // adapte le chemin si nécessaire

const users = [
  {
    nom: "Super",
    prenom: "Admin",
    email: "superadmin@mail.com",
    mot_de_passe: "super123", // mot de passe en clair
    role: "SUPER_ADMIN"
  },
  {
    nom: "Admin",
    prenom: "Election",
    email: "adminelection@mail.com",
    mot_de_passe: "admin123",
    role: "ADMIN_ELECTION"
  },
  {
    nom: "Electeur",
    prenom: "Test",
    email: "electeur@mail.com",
    mot_de_passe: "vote123",
    role: "ELECTEUR"
  }
];

const createUsers = async () => {
  try {
    for (const u of users) {
      const hashed = await bcrypt.hash(u.mot_de_passe, 10);
      await pool.query(
        "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)",
        [u.nom, u.prenom, u.email, hashed, u.role]
      );
      console.log(`Utilisateur créé : ${u.email} (${u.role})`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Erreur lors de la création des utilisateurs :", err);
    process.exit(1);
  }
};

createUsers();