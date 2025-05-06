"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwtSecret = process.env.JWT_SECRET;
const authenticateJWT = (req, res, next) => {
    var _a;
    const cookieToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    // Check Authorization header
    const authHeader = req.headers.authorization;
    const headerToken = authHeader ? authHeader.split(" ")[1] : null;
    // Use either token source
    const token = cookieToken || headerToken;
    if (!token) {
        return res
            .status(401)
            .json({ message: "Access denied. No token provided." });
    }
    try {
        // Verify and decode the token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Attach the entire decoded token to req.user
        req.user = decoded;
        // Extract selectedDatabase if present
        const selectedDatabase = decoded.selectedDatabase;
        // If no database is selected, default to a specific one or handle as needed
        if (!selectedDatabase) {
            console.warn("No database selected in token, using default database");
            // You can set a default database or handle this case as needed
            // (req as any).user.selectedDatabase = "default_database";
        }
        // Log which database is being used (for debugging)
        console.log(`Using database: ${req.user.selectedDatabase || "default"}`);
        next();
    }
    catch (err) {
        console.error("Token verification failed:", err);
        res.status(403).json({ message: "Invalid or expired token." });
    }
};
exports.authenticateJWT = authenticateJWT;
