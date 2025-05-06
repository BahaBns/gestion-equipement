import express from "express";
import * as statusController from "../controllers/statusController";

const router = express.Router();

// Get all statuses
router.get("/", statusController.getAllStatuses);

// Get actifs by status
router.get("/:statusId/actifs", statusController.getActifsByStatus);

// Get licenses by status
router.get("/:statusId/licenses", statusController.getLicensesByStatus);

// Update actif status
router.put("/actif/:actifId", statusController.updateActifStatus);

// Update license status - This was missing
router.put("/license/:licenseId", statusController.updateLicenseStatus);

// Create new status
router.post("/", statusController.createStatus);

// Delete status
router.delete("/:statusId", statusController.deleteStatus);

// Get status usage statistics
router.get("/stats", statusController.getStatusUsageStats);

export default router;