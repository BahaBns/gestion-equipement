import express, { Request, Response } from "express";
import {
  getLicenseTypes,
  getLicenseTypeById,
  createLicenseType,
  updateLicenseType,
  deleteLicenseType,
  getAllLicenseTypes,
} from "../controllers/licenseTypeController";

// Define an interface that extends the Express Request type
interface CategoryRequest extends Request {
  params: {
    categoryId?: string;
    licenseTypeId?: string;
  };
}

const router = express.Router({ mergeParams: true });

// Route depends on whether it's mounted at /licensetypes or /categories/:categoryId/licensetypes
router.get("/", (req: CategoryRequest, res: Response) => {
  // If categoryId exists in params, use getLicenseTypes (category-specific)
  // Otherwise use getAllLicenseTypes (get all)
  if (req.params.categoryId) {
    return getLicenseTypes(req, res);
  } else {
    return getAllLicenseTypes(req, res);
  }
});

// These routes work the same regardless of mount point
router.post("/", createLicenseType);
router.get("/:licenseTypeId", getLicenseTypeById);
router.put("/:licenseTypeId", updateLicenseType);
router.delete("/:licenseTypeId", deleteLicenseType);

export default router;
