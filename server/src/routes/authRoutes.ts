import express from "express";
import { login, selectDatabase } from "../controllers/authController";

const router = express.Router();

// Public routes
router.post("/login", login);

router.post("/select-database", selectDatabase);

export default router;
