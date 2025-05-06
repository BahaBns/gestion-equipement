import express from "express";
import * as fournisseurController from "../controllers/FournisseurController";

const router = express.Router();

// Fournisseur routes
router.get("/", fournisseurController.getFournisseurs);
router.get("/:fournisseurId", fournisseurController.getFournisseurById);
router.post("/", fournisseurController.createFournisseur);
router.put("/:fournisseurId", fournisseurController.updateFournisseur);
router.delete("/:fournisseurId", fournisseurController.deleteFournisseur);


export default router;
