import express from "express";
import * as attachmentController from "../controllers/attachementsController";

const router = express.Router();

// Upload attachment to an actif (single file)
router.post(
  "/actif/:actifId",
  attachmentController.upload.single("file"),
  attachmentController.uploadAttachment
);

// Upload multiple attachments to an actif
router.post(
  "/actif/:actifId/multiple",
  attachmentController.upload.array("files", 5),
  attachmentController.uploadMultipleAttachments
);

// Delete an attachment
router.delete("/:attachmentId", attachmentController.deleteAttachment);

// Get all attachments for an actif
router.get("/actif/:actifId", attachmentController.getActifAttachments);

// Download an attachment
router.get("/:attachmentId/download", attachmentController.downloadAttachment);

export default router;
