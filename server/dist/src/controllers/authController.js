"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.requestPasswordReset = exports.selectDatabase = exports.login = void 0;
// server/controllers/authController.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_client_1 = require("@prisma/auth-client");
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto")); // For generating reset tokens
const nodemailer_1 = __importDefault(require("nodemailer")); // For sending emails
dotenv_1.default.config();
const prisma = new auth_client_1.PrismaClient();
const jwtSecret = process.env.JWT_SECRET || "default_secret";
const jwtExpiresIn = "1h";
const TOKEN_EXPIRY = "7d"; // For session tokens
// --- Existing login and selectDatabase functions ---
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body; // 'username' from req.body is treated as email
    if (!username || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { email: username },
        });
        if (!user) {
            // console.log("User not found with email:", username); // Already logged
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const validPassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            // console.log("Invalid password for email:", username); // Already logged
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const tokenPayload = {
            id: user.id,
            email: user.email,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, {
            expiresIn: jwtExpiresIn,
        });
        // console.log("Generated token for user:", user.email); // Already logged
        res
            .cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        })
            .json({
            success: true,
            message: "Login successful",
            token: token,
        });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error during login" });
    }
});
exports.login = login;
const selectDatabase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, selectedDatabase } = req.body;
    if (!token || !selectedDatabase) {
        return res.status(400).json({
            success: false,
            message: "Token and database selection are required",
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { iat, exp } = decoded, payloadWithoutExp = __rest(decoded, ["iat", "exp"]);
        const newToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payloadWithoutExp), { selectedDatabase }), jwtSecret, { expiresIn: TOKEN_EXPIRY || "7d" });
        res
            .cookie("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        })
            .json({
            success: true,
            message: "Database selected successfully",
            token: newToken,
        });
    }
    catch (error) {
        console.error("Database selection error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
});
exports.selectDatabase = selectDatabase;
// --- New Password Reset Functions ---
const requestPasswordReset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .json({ success: false, message: "Email is required." });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { email: email.toLowerCase() }, // Normalize email
        });
        if (user) {
            const resetToken = crypto_1.default.randomBytes(32).toString("hex");
            const passwordResetTokenExpiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour (3600000 ms)
            yield prisma.user.update({
                where: { email: user.email }, // Use user.email to ensure correct casing from DB
                data: {
                    passwordResetToken: resetToken,
                    passwordResetTokenExpiresAt,
                },
            });
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            console.log(`Generated reset URL for ${user.email}: ${resetUrl}`); // For debugging
            const transporter = nodemailer_1.default.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: process.env.EMAIL_SECURE === "true",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    // do not fail on invalid certs if using self-signed or local dev SMTP
                    rejectUnauthorized: process.env.NODE_ENV === "production",
                },
            });
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || "Insight Times Intranet"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Password Reset Request",
                html: `
<p>Bonjour ${user.name || user.email},</p>
<p>Vous (ou quelqu'un d'autre) avez demandé une réinitialisation de mot de passe pour votre compte.</p>
<p>Si c'était bien vous, veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
<p><a href="${resetUrl}" target="_blank" style="color: #007857; text-decoration: none; font-weight: bold;">Réinitialiser votre mot de passe</a></p>
<p>Si vous ne pouvez pas cliquer sur le lien, copiez et collez cette URL dans votre navigateur :</p>
<p>${resetUrl}</p>
<p>Ce lien expirera dans 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation de mot de passe, veuillez ignorer cet e-mail ou contacter le support si vous avez des inquiétudes.</p>
<br/>
<p>Merci,</p>
<p>L'équipe Insight Times</p>
        `,
            };
            try {
                yield transporter.sendMail(mailOptions);
                console.log(`Password reset email successfully sent to ${user.email}.`);
            }
            catch (emailError) {
                console.error(`Failed to send password reset email to ${user.email}:`, emailError);
                // Even if email fails, we don't want to tell the client that the user exists
                // The generic message below handles user enumeration protection.
                // However, this internal error should be monitored.
            }
        }
        else {
            console.log(`Password reset requested for non-existent or non-matching email: ${email}`);
        }
        // Always return a generic message to prevent user enumeration
        return res.status(200).json({
            success: true, // Indicate the operation was processed, not necessarily that an email was sent for a specific user
            message: "Si votre adresse e-mail est enregistrée chez nous, vous recevrez sous peu un lien de réinitialisation de mot de passe.",
        });
    }
    catch (error) {
        console.error("Error in requestPasswordReset controller:", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur interne du serveur s'est produite . Veuillez réessayer ultérieurement.",
        });
    }
});
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Token et nouveau mot de passe sont requis.",
        });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
        // Example: Enforce minimum password length and type
        return res.status(400).json({
            success: false,
            message: "Le mot de passe doit comporter au moins 8 caractères.",
        });
    }
    try {
        const user = yield prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetTokenExpiresAt: {
                    gt: new Date(), // Token must not be expired
                },
            },
        });
        if (!user) {
            console.log("Invalid or expired password reset token attempt:", token);
            return res.status(400).json({
                success: false,
                message: "Ce token de réinitialisation de mot de passe n'est pas valide ou a expiré. Veuillez en demander un nouveau.",
            });
        }
        const saltRounds = 10;
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, saltRounds);
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null, // Invalidate the token after use
                passwordResetTokenExpiresAt: null, // Clear expiry
            },
        });
        console.log(`Password successfully reset for user: ${user.email}`);
        // Optionally, send a confirmation email to the user that their password was changed.
        return res.status(200).json({
            success: true,
            message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        });
    }
    catch (error) {
        console.error("Error in resetPassword controller:", error);
        return res.status(500).json({
            success: false,
            message: "Une erreur interne du serveur s'est produite lors de la réinitialisation de votre mot de passe. Veuillez réessayer.",
        });
    }
});
exports.resetPassword = resetPassword;
