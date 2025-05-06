import { Router } from "express";
import {
  getActifs,
  createActif,
  updateActif,
  deleteActif,
  assignActifsToEmployee,
  removeActifsFromEmployee,
  getActifAssignments,
  getActifById,
  getSpecificationByActifId,
  updateActifStatus,
  getActifAttachments,
  updateActifWarranty,
  getActifsByStatus,
  getActifsByActifType,
  getActifBySerialNumber,
  // Add import for the upload middleware
  upload,
  getExpiringActifs,
  updateActifQuantity,
} from "../controllers/actifController";

const router = Router();

// Basic CRUD operations
router.get("/", getActifs);
// Update the create route to handle file uploads (max 5 files)
router.post("/", upload.array("files", 5), createActif);
// Update the update route to handle file uploads (max 5 files)
router.put("/:actifId", upload.array("files", 5), updateActif);
router.delete("/:actifId", deleteActif);
router.get("/:actifId", getActifById);

// Employee assignment routes
router.post("/assign/:employeeId", assignActifsToEmployee);
router.post("/remove/:employeeId", removeActifsFromEmployee);
router.get("/assignments", getActifAssignments);

// Filter and search routes
router.get("/status/:statusId", getActifsByStatus);
router.get("/type/:actifTypeId", getActifsByActifType);
router.get("/serial/:serialNumber", getActifBySerialNumber);
router.get("/expiring", getExpiringActifs);

// Attachment routes
router.get("/:actifId/attachments", getActifAttachments);

// Specification routes
router.get("/:actifId/specification", getSpecificationByActifId);

// Other operations
router.patch("/:actifId/status", updateActifStatus);
router.patch("/:actifId/warranty", updateActifWarranty);
router.patch("/:actifId/quantity", updateActifQuantity);

export default router;
