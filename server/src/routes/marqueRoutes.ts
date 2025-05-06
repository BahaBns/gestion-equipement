import express from "express";
import * as marqueController from "../controllers/marqueController";

const router = express.Router();

// Get all marques
router.get("/", marqueController.getMarques);

// Get marques by actifType
router.get(
  "/by-actiftype/:actifTypeId",
  marqueController.getMarquesByActifType
);

// Create a new marque
router.post("/", marqueController.createMarque);

// Update a marque
router.put("/:marqueId", marqueController.updateMarque);

// Delete a marque
router.delete("/:marqueId", marqueController.deleteMarque);

export default router;
