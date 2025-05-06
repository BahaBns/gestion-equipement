import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

/* ROUTE IMPORTS */
import licenseRoutes from "./routes/licenseRoutes";
import licenseTypeRoutes from "./routes/licenseTypeRoutes";
import licenseAttachmentRoutes from "./routes/licenseAttachementsRoutes";
import actifTypeRoutes from "./routes/actifTypeRoutes";
import statusRoutes from "./routes/statusRoutes";
import attachmentRoutes from "./routes/attachementsRoutes";
import specificationRoutes from "./routes/specificationRoutes";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import actifRoutes from "./routes/actifRoute";
import employeeRoutes from "./routes/employeeRoutes";
import subcategoryRoutes from "./routes/actifTypeRoutes";
import { authenticateJWT } from "./middleware/authMiddleware";
import cookieParser from "cookie-parser";
import path from "path";
import hashtagRoutes from "./routes/hashtagRoutes";
import etatRoutes from "./routes/etatRoutes";
import acceptanceRoutes from "./routes/acceptanceRoutes";
import licenseAcceptanceRoutes from "./routes/licenseAcceptanceRoutes";
import marqueRoutes from "./routes/marqueRoutes";
import modeleRoutes from "./routes/modeleRoutes";
import fournisseurRoutes from "./routes/fournisseurRoutes";


//config
import { initializeTaskScheduler } from "./services/taskScheduler";





/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());

// And ensure you have body-parser middleware

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin:  ["http://intranet.insight-times.com", "http://localhost:3000"], // Replace with your frontend URL
    credentials: true, // Allow cookies if using authentication
  })
);

/* AUTH ROUTE */
app.use("/auth", authRoutes); // http://localhost:8000/auth

//serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* PROTECTED ROUTES */
app.use('/license-acceptance', licenseAcceptanceRoutes); // New routes for license acceptance
app.use("/acceptance", acceptanceRoutes);
app.use("/hashtags",authenticateJWT, hashtagRoutes);
app.use("/categories", authenticateJWT, categoryRoutes);
app.use("/categories/:categoryId/actiftypes", authenticateJWT, actifTypeRoutes);
app.use("/actif", authenticateJWT, actifRoutes);
app.use("/employee", authenticateJWT, employeeRoutes);
app.use("/actifs", authenticateJWT, actifRoutes);
app.use("/status", authenticateJWT, statusRoutes);
app.use("/etats",authenticateJWT, etatRoutes);
app.use("/attachments", authenticateJWT, attachmentRoutes);
app.use("/specifications", authenticateJWT, specificationRoutes);
app.use("/licenses", authenticateJWT, licenseRoutes);
app.use("/actiftypes", authenticateJWT, actifTypeRoutes);
app.use(
  "/categories/:categoryId/licensetypes",
  authenticateJWT,
  licenseTypeRoutes
);
app.use("/licensetypes",authenticateJWT,licenseTypeRoutes);

app.use("/license-attachments", authenticateJWT, licenseAttachmentRoutes);
app.use("/marques", authenticateJWT, marqueRoutes);
app.use("/modeles", authenticateJWT, modeleRoutes);
app.use("/fournisseurs", authenticateJWT, fournisseurRoutes);



initializeTaskScheduler();
/* SERVER */
const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
