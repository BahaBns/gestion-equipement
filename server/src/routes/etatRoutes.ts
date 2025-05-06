import express from "express";
import * as etatController from "../controllers/etatController";

const router = express.Router();

// Get all etats
router.get("/", etatController.getAllEtats);

// Get actifs by etat
router.get("/:etatId/actifs", etatController.getActifsByEtat);

// Get licenses by etat
router.get("/:etatId/licenses", etatController.getLicensesByEtat);

// Update actif etat
router.put("/actif/:actifId", etatController.updateActifEtat);

// Update license etat
router.put("/license/:licenseId", etatController.updateLicenseEtat);

// Create new etat
router.post("/", etatController.createEtat);

// Delete etat
router.delete("/:etatId", etatController.deleteEtat);

// Get etat usage statistics
router.get("/stats", etatController.getEtatUsageStats);

export default router;
