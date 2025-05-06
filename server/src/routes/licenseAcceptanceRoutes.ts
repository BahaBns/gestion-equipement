// routes/licenseAcceptanceRoutes.ts
import { Router } from "express";
import {
  validateLicenseToken,
  acceptLicenseAssignment,
  rejectLicenseAssignment,
  resendLicenseInvitation,
} from "../controllers/licenseAcceptanceController";

const router = Router();

// Validate a token and return assignment information
router.get("/validate/:token", validateLicenseToken);

// Accept a license assignment
router.post("/accept/:token", acceptLicenseAssignment);

// Reject a license assignment
router.post("/reject/:token", rejectLicenseAssignment);

// Resend license assignment invitation email
router.post("/resend", resendLicenseInvitation);

export default router;
