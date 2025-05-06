import express from "express";
import {
  uploadLicenseAttachment,
  deleteLicenseAttachment,
  getLicenseAttachments,
  getLicenseAttachmentById,
  uploadMultipleLicenseAttachments,
  uploadSingle,
} from "../controllers/licenseAttachementsController";

const router = express.Router();

// Upload a single attachment to a license
router.post(
  "/license/:licenseId",
  uploadSingle.single("file"),
  uploadLicenseAttachment
);

// Upload multiple attachments to a license
router.post(
  "/license/:licenseId/multiple",
  uploadSingle.array("files"),
  uploadMultipleLicenseAttachments
);

// Delete a license attachment
router.delete("/:attachmentId", deleteLicenseAttachment);

// Get all attachments for a license
router.get("/license/:licenseId", getLicenseAttachments);

// Get a specific attachment by ID
router.get("/:attachmentId", getLicenseAttachmentById);

export default router;
