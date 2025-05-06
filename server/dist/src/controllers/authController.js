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
exports.selectDatabase = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwtSecret = process.env.JWT_SECRET || "default_secret";
const jwtExpiresIn = "1h";
const TOKEN_EXPIRY = "7d";
// Dummy user data (replace with database)
const users = [
    {
        id: 1,
        username: "admin",
        password: "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC",
    }, // password: "admin123"
];
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);
    if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Invalid username or password" });
    }
    const validPassword = yield bcryptjs_1.default.compare(password, user.password);
    if (!validPassword) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid username or password" });
    }
    try {
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: jwtExpiresIn });
        console.log("Generated token:", token);
        res
            .cookie("token", token, {
            httpOnly: true,
            maxAge: 3600000, // 1 hour
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        })
            .json({
            success: true,
            message: "Login successful",
            token: token, // Include token in response for client storage
        });
    }
    catch (error) {
        console.error("JWT Signing Error:", error);
        res.status(500).json({ message: "Internal server error" });
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
        // Verify the token is valid
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const { iat, exp } = decoded, payloadWithoutExp = __rest(decoded, ["iat", "exp"]);
        // Create a new token with the selected database
        const newToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payloadWithoutExp), { selectedDatabase }), jwtSecret, { expiresIn: TOKEN_EXPIRY || "7d" });
        res
            .cookie("token", newToken, {
            httpOnly: true,
            maxAge: 3600000, // 1 hour
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
