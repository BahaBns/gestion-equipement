"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
/* ROUTE IMPORTS */
const licenseRoutes_1 = __importDefault(require("./routes/licenseRoutes"));
const licenseTypeRoutes_1 = __importDefault(require("./routes/licenseTypeRoutes"));
const licenseAttachementsRoutes_1 = __importDefault(require("./routes/licenseAttachementsRoutes"));
const actifTypeRoutes_1 = __importDefault(require("./routes/actifTypeRoutes"));
const statusRoutes_1 = __importDefault(require("./routes/statusRoutes"));
const attachementsRoutes_1 = __importDefault(require("./routes/attachementsRoutes"));
const specificationRoutes_1 = __importDefault(require("./routes/specificationRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const actifRoute_1 = __importDefault(require("./routes/actifRoute"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const hashtagRoutes_1 = __importDefault(require("./routes/hashtagRoutes"));
const etatRoutes_1 = __importDefault(require("./routes/etatRoutes"));
const acceptanceRoutes_1 = __importDefault(require("./routes/acceptanceRoutes"));
const licenseAcceptanceRoutes_1 = __importDefault(require("./routes/licenseAcceptanceRoutes"));
const marqueRoutes_1 = __importDefault(require("./routes/marqueRoutes"));
const modeleRoutes_1 = __importDefault(require("./routes/modeleRoutes"));
const fournisseurRoutes_1 = __importDefault(require("./routes/fournisseurRoutes"));
//config
const taskScheduler_1 = require("./services/taskScheduler");
/* CONFIGURATIONS */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
// And ensure you have body-parser middleware
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: ["http://intranet.insight-times.com", "http://localhost:3000"], // Replace with your frontend URL
    credentials: true, // Allow cookies if using authentication
}));
/* AUTH ROUTE */
app.use("/auth", authRoutes_1.default); // http://localhost:8000/auth
//serve static files from the uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
/* PROTECTED ROUTES */
app.use('/license-acceptance', licenseAcceptanceRoutes_1.default); // New routes for license acceptance
app.use("/acceptance", acceptanceRoutes_1.default);
app.use("/hashtags", authMiddleware_1.authenticateJWT, hashtagRoutes_1.default);
app.use("/categories", authMiddleware_1.authenticateJWT, categoryRoutes_1.default);
app.use("/categories/:categoryId/actiftypes", authMiddleware_1.authenticateJWT, actifTypeRoutes_1.default);
app.use("/actif", authMiddleware_1.authenticateJWT, actifRoute_1.default);
app.use("/employee", authMiddleware_1.authenticateJWT, employeeRoutes_1.default);
app.use("/actifs", authMiddleware_1.authenticateJWT, actifRoute_1.default);
app.use("/status", authMiddleware_1.authenticateJWT, statusRoutes_1.default);
app.use("/etats", authMiddleware_1.authenticateJWT, etatRoutes_1.default);
app.use("/attachments", authMiddleware_1.authenticateJWT, attachementsRoutes_1.default);
app.use("/specifications", authMiddleware_1.authenticateJWT, specificationRoutes_1.default);
app.use("/licenses", authMiddleware_1.authenticateJWT, licenseRoutes_1.default);
app.use("/actiftypes", authMiddleware_1.authenticateJWT, actifTypeRoutes_1.default);
app.use("/categories/:categoryId/licensetypes", authMiddleware_1.authenticateJWT, licenseTypeRoutes_1.default);
app.use("/licensetypes", authMiddleware_1.authenticateJWT, licenseTypeRoutes_1.default);
app.use("/license-attachments", authMiddleware_1.authenticateJWT, licenseAttachementsRoutes_1.default);
app.use("/marques", authMiddleware_1.authenticateJWT, marqueRoutes_1.default);
app.use("/modeles", authMiddleware_1.authenticateJWT, modeleRoutes_1.default);
app.use("/fournisseurs", authMiddleware_1.authenticateJWT, fournisseurRoutes_1.default);
(0, taskScheduler_1.initializeTaskScheduler)();
/* SERVER */
const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
