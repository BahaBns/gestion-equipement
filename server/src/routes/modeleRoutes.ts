import express from "express";
import * as modeleController from "../controllers/modeleController";

const router = express.Router();


// Get all modeles
router.get("/", modeleController.getModeles);

// Get all modeles by marque
router.get("/by-marque/:marqueId", modeleController.getModelesByMarque);

// Create a new modele for a marque
router.post("/marque/:marqueId", modeleController.createModele);

// Update a modele
router.put("/:modeleId", modeleController.updateModele);

// Delete a modele
router.delete("/:modeleId", modeleController.deleteModele);

export default router;
