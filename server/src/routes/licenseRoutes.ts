import { Router } from "express";
import {
  getLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  assignLicensesToEmployee,
  removeLicensesFromEmployee,
  getLicenseAssignments,
  getLicenseById,
  getLicenseAttachments,
  updateLicenseExpiry,
  getLicensesByType,
  getLicensesBySoftware,
  getExpiringLicenses,
  getExpiredLicenses,
  renewLicense,
  getLicenseUsageStats,
  upload, // Import the upload middleware
} from "../controllers/licenseController";

const router = Router();

// Basic CRUD operations
router.get("/", getLicenses);
router.post("/", upload.array("files"), createLicense); // Add upload middleware
router.put("/:licenseId", upload.array("files"), updateLicense); // Add upload middleware
router.delete("/:licenseId", deleteLicense);
router.get("/:licenseId", getLicenseById);

// Employee assignment routes
router.post("/assign/:employeeId", assignLicensesToEmployee);
router.post("/remove/:employeeId", removeLicensesFromEmployee);
router.get("/assignments", getLicenseAssignments);

// Filter and search routes
router.get("/type/:licenseTypeId", getLicensesByType);
router.get("/software/:softwareName", getLicensesBySoftware);
router.get("/expiring", getExpiringLicenses);
router.get("/expired", getExpiredLicenses);
router.get("/stats", getLicenseUsageStats);

// Attachment routes
router.get("/:licenseId/attachments", getLicenseAttachments);

// Other operations
router.patch("/:licenseId/expiry", updateLicenseExpiry);
router.post("/:licenseId/renew", upload.array("files"), renewLicense); // Add upload middleware

export default router;
