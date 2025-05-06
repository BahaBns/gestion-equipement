"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attachmentController = __importStar(require("../controllers/attachementsController"));
const router = express_1.default.Router();
// Upload attachment to an actif (single file)
router.post("/actif/:actifId", attachmentController.upload.single("file"), attachmentController.uploadAttachment);
// Upload multiple attachments to an actif
router.post("/actif/:actifId/multiple", attachmentController.upload.array("files", 5), attachmentController.uploadMultipleAttachments);
// Delete an attachment
router.delete("/:attachmentId", attachmentController.deleteAttachment);
// Get all attachments for an actif
router.get("/actif/:actifId", attachmentController.getActifAttachments);
// Download an attachment
router.get("/:attachmentId/download", attachmentController.downloadAttachment);
exports.default = router;
