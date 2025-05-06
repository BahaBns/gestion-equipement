import express from "express";
import * as specificationController from "../controllers/specificationController";

const router = express.Router();

// Get all specifications
router.get("/", specificationController.getAllSpecifications);

// Get specification by actif ID
router.get(
  "/actif/:actifId",
  specificationController.getSpecificationByActifId
);

// Update or create specification for an actif
router.put("/actif/:actifId", specificationController.updateSpecification);

export default router;
