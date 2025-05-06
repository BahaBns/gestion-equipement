"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/acceptanceRoutes.ts
const express_1 = require("express");
const acceptanceController_1 = require("../controllers/acceptanceController");
const router = (0, express_1.Router)();
// Validate a token and return assignment information
router.get("/validate/:token", acceptanceController_1.validateAssignmentToken);
// Accept an assignment
router.post("/accept/:token", acceptanceController_1.acceptAssignment);
// Reject an assignment
router.post("/reject/:token", acceptanceController_1.rejectAssignment);
// resend assignement invitation email
router.post("/resend", acceptanceController_1.resendAssignmentInvitation);
exports.default = router;
