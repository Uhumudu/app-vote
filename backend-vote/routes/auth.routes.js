import express from "express";
import { login,
    registerAndCreateElection
 } from "../controllers/auth.controller.js";

const router = express.Router();

// Route login
router.post("/login", login);
router.post("/register-and-create-election", registerAndCreateElection);

export default router;
