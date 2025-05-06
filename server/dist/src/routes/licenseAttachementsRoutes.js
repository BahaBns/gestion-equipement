"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const licenseAttachementsController_1 = require("../controllers/licenseAttachementsController");
const router = express_1.default.Router();
// Upload a single attachment to a license
router.post("/license/:licenseId", licenseAttachementsController_1.uploadSingle.single("file"), licenseAttachementsController_1.uploadLicenseAttachment);
// Upload multiple attachments to a license
router.post("/license/:licenseId/multiple", licenseAttachementsController_1.uploadSingle.array("files"), licenseAttachementsController_1.uploadMultipleLicenseAttachments);
// Delete a license attachment
router.delete("/:attachmentId", licenseAttachementsController_1.deleteLicenseAttachment);
// Get all attachments for a license
router.get("/license/:licenseId", licenseAttachementsController_1.getLicenseAttachments);
// Get a specific attachment by ID
router.get("/:attachmentId", licenseAttachementsController_1.getLicenseAttachmentById);
exports.default = router;
