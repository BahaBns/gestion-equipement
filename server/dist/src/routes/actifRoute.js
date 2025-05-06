"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const actifController_1 = require("../controllers/actifController");
const router = (0, express_1.Router)();
// Basic CRUD operations
router.get("/", actifController_1.getActifs);
// Update the create route to handle file uploads (max 5 files)
router.post("/", actifController_1.upload.array("files", 5), actifController_1.createActif);
// Update the update route to handle file uploads (max 5 files)
router.put("/:actifId", actifController_1.upload.array("files", 5), actifController_1.updateActif);
router.delete("/:actifId", actifController_1.deleteActif);
router.get("/:actifId", actifController_1.getActifById);
// Employee assignment routes
router.post("/assign/:employeeId", actifController_1.assignActifsToEmployee);
router.post("/remove/:employeeId", actifController_1.removeActifsFromEmployee);
router.get("/assignments", actifController_1.getActifAssignments);
// Filter and search routes
router.get("/status/:statusId", actifController_1.getActifsByStatus);
router.get("/type/:actifTypeId", actifController_1.getActifsByActifType);
router.get("/serial/:serialNumber", actifController_1.getActifBySerialNumber);
router.get("/expiring", actifController_1.getExpiringActifs);
// Attachment routes
router.get("/:actifId/attachments", actifController_1.getActifAttachments);
// Specification routes
router.get("/:actifId/specification", actifController_1.getSpecificationByActifId);
// Other operations
router.patch("/:actifId/status", actifController_1.updateActifStatus);
router.patch("/:actifId/warranty", actifController_1.updateActifWarranty);
router.patch("/:actifId/quantity", actifController_1.updateActifQuantity);
exports.default = router;
