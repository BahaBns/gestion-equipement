// routes/acceptanceRoutes.ts
import { Router } from "express";
import {
  validateAssignmentToken,
  acceptAssignment,
  rejectAssignment,
  resendAssignmentInvitation,
} from "../controllers/acceptanceController";

const router = Router();

// Validate a token and return assignment information
router.get("/validate/:token", validateAssignmentToken);

// Accept an assignment
router.post("/accept/:token", acceptAssignment);

// Reject an assignment
router.post("/reject/:token", rejectAssignment);


// resend assignement invitation email
router.post("/resend", resendAssignmentInvitation);

export default router;
