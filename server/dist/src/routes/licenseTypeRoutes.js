"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const licenseTypeController_1 = require("../controllers/licenseTypeController");
const router = express_1.default.Router({ mergeParams: true });
// Route depends on whether it's mounted at /licensetypes or /categories/:categoryId/licensetypes
router.get("/", (req, res) => {
    // If categoryId exists in params, use getLicenseTypes (category-specific)
    // Otherwise use getAllLicenseTypes (get all)
    if (req.params.categoryId) {
        return (0, licenseTypeController_1.getLicenseTypes)(req, res);
    }
    else {
        return (0, licenseTypeController_1.getAllLicenseTypes)(req, res);
    }
});
// These routes work the same regardless of mount point
router.post("/", licenseTypeController_1.createLicenseType);
router.get("/:licenseTypeId", licenseTypeController_1.getLicenseTypeById);
router.put("/:licenseTypeId", licenseTypeController_1.updateLicenseType);
router.delete("/:licenseTypeId", licenseTypeController_1.deleteLicenseType);
exports.default = router;
