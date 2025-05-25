import express from "express";
import { login, selectDatabase ,requestPasswordReset, resetPassword } from "../controllers/authController";

const router = express.Router();

// Public routes
router.post("/login", login);

router.post("/select-database", selectDatabase);

// New routes for password reset
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Add the clear-session endpoint
router.post("/clear-session", (req, res) => {
  // Clear the HTTP-only cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  // Clear any other HTTP-only cookies you might have
  res.clearCookie("selectedDatabase", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({ success: true, message: "Session cleared" });
});

export default router;
