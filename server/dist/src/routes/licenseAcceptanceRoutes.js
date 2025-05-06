"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/licenseAcceptanceRoutes.ts
const express_1 = require("express");
const licenseAcceptanceController_1 = require("../controllers/licenseAcceptanceController");
const router = (0, express_1.Router)();
// Validate a token and return assignment information
router.get("/validate/:token", licenseAcceptanceController_1.validateLicenseToken);
// Accept a license assignment
router.post("/accept/:token", licenseAcceptanceController_1.acceptLicenseAssignment);
// Reject a license assignment
router.post("/reject/:token", licenseAcceptanceController_1.rejectLicenseAssignment);
// Resend license assignment invitation email
router.post("/resend", licenseAcceptanceController_1.resendLicenseInvitation);
exports.default = router;
