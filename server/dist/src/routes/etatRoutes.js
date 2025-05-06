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
const etatController = __importStar(require("../controllers/etatController"));
const router = express_1.default.Router();
// Get all etats
router.get("/", etatController.getAllEtats);
// Get actifs by etat
router.get("/:etatId/actifs", etatController.getActifsByEtat);
// Get licenses by etat
router.get("/:etatId/licenses", etatController.getLicensesByEtat);
// Update actif etat
router.put("/actif/:actifId", etatController.updateActifEtat);
// Update license etat
router.put("/license/:licenseId", etatController.updateLicenseEtat);
// Create new etat
router.post("/", etatController.createEtat);
// Delete etat
router.delete("/:etatId", etatController.deleteEtat);
// Get etat usage statistics
router.get("/stats", etatController.getEtatUsageStats);
exports.default = router;
