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
const statusController = __importStar(require("../controllers/statusController"));
const router = express_1.default.Router();
// Get all statuses
router.get("/", statusController.getAllStatuses);
// Get actifs by status
router.get("/:statusId/actifs", statusController.getActifsByStatus);
// Get licenses by status
router.get("/:statusId/licenses", statusController.getLicensesByStatus);
// Update actif status
router.put("/actif/:actifId", statusController.updateActifStatus);
// Update license status - This was missing
router.put("/license/:licenseId", statusController.updateLicenseStatus);
// Create new status
router.post("/", statusController.createStatus);
// Delete status
router.delete("/:statusId", statusController.deleteStatus);
// Get status usage statistics
router.get("/stats", statusController.getStatusUsageStats);
exports.default = router;
