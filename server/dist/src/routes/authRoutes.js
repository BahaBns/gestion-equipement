"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
// Public routes
router.post("/login", authController_1.login);
router.post("/select-database", authController_1.selectDatabase);
// New routes for password reset
router.post("/request-password-reset", authController_1.requestPasswordReset);
router.post("/reset-password", authController_1.resetPassword);
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
exports.default = router;
