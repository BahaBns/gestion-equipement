"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const licenseController_1 = require("../controllers/licenseController");
const router = (0, express_1.Router)();
// Basic CRUD operations
router.get("/", licenseController_1.getLicenses);
router.post("/", licenseController_1.upload.array("files"), licenseController_1.createLicense); // Add upload middleware
router.put("/:licenseId", licenseController_1.upload.array("files"), licenseController_1.updateLicense); // Add upload middleware
router.delete("/:licenseId", licenseController_1.deleteLicense);
router.get("/:licenseId", licenseController_1.getLicenseById);
// Employee assignment routes
router.post("/assign/:employeeId", licenseController_1.assignLicensesToEmployee);
router.post("/remove/:employeeId", licenseController_1.removeLicensesFromEmployee);
router.get("/assignments", licenseController_1.getLicenseAssignments);
// Filter and search routes
router.get("/type/:licenseTypeId", licenseController_1.getLicensesByType);
router.get("/software/:softwareName", licenseController_1.getLicensesBySoftware);
router.get("/expiring", licenseController_1.getExpiringLicenses);
router.get("/expired", licenseController_1.getExpiredLicenses);
router.get("/stats", licenseController_1.getLicenseUsageStats);
// Attachment routes
router.get("/:licenseId/attachments", licenseController_1.getLicenseAttachments);
// Other operations
router.patch("/:licenseId/expiry", licenseController_1.updateLicenseExpiry);
router.post("/:licenseId/renew", licenseController_1.upload.array("files"), licenseController_1.renewLicense); // Add upload middleware
exports.default = router;
