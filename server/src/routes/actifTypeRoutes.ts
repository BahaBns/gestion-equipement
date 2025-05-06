import express, { Request, Response } from "express";
import {
  getActifTypes,
  getActifTypeById,
  createActifType,
  updateActifType,
  deleteActifType,
  getAllActifTypes,
} from "../controllers/actifTypeController";

// Define an interface that extends the Express Request type
interface CategoryRequest extends Request {
  params: {
    categoryId?: string;
    actifTypeId?: string;
  };
}

const router = express.Router({ mergeParams: true });

// Route depends on whether it's mounted at /actiftypes or /categories/:categoryId/actiftypes
router.get("/", (req: CategoryRequest, res: Response) => {
  // If categoryId exists in params, use getActifTypes (category-specific)
  // Otherwise use getAllActifTypes (get all)
  if (req.params.categoryId) {
    return getActifTypes(req, res);
  } else {
    return getAllActifTypes(req, res);
  }
});

// These routes work the same regardless of mount point
router.post("/", createActifType);
router.get("/:actifTypeId", getActifTypeById);
router.put("/:actifTypeId", updateActifType);
router.delete("/:actifTypeId", deleteActifType);

export default router;
