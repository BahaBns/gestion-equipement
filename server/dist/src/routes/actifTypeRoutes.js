"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const actifTypeController_1 = require("../controllers/actifTypeController");
const router = express_1.default.Router({ mergeParams: true });
// Route depends on whether it's mounted at /actiftypes or /categories/:categoryId/actiftypes
router.get("/", (req, res) => {
    // If categoryId exists in params, use getActifTypes (category-specific)
    // Otherwise use getAllActifTypes (get all)
    if (req.params.categoryId) {
        return (0, actifTypeController_1.getActifTypes)(req, res);
    }
    else {
        return (0, actifTypeController_1.getAllActifTypes)(req, res);
    }
});
// These routes work the same regardless of mount point
router.post("/", actifTypeController_1.createActifType);
router.get("/:actifTypeId", actifTypeController_1.getActifTypeById);
router.put("/:actifTypeId", actifTypeController_1.updateActifType);
router.delete("/:actifTypeId", actifTypeController_1.deleteActifType);
exports.default = router;
