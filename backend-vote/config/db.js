// backend/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "vote_en_ligne",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});































// import mysql from "mysql2";

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "vote_en_ligne"
// });

// db.connect(err => {
//   if (err) {
//     console.error("Erreur MySQL:", err);
//   } else {
//     console.log("MySQL connecté");
//   }
// });

// export default db;