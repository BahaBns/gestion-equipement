// routes/hashtagRoutes.js
import express from "express";
import { hashtagController } from "../controllers/hashtagController";

const router = express.Router();

// Route pour récupérer tous les hashtags
router.get("/", hashtagController.getAllHashtags);

// Route pour créer un nouveau hashtag
router.post("/", hashtagController.createHashtag);

// Route pour rechercher des hashtags par terme
router.get("/search/:term", hashtagController.searchHashtags);

// Route pour récupérer un hashtag par son ID
router.get("/:id", hashtagController.getHashtagById);

// Route pour mettre à jour un hashtag
router.put("/:id", hashtagController.updateHashtag);

// Route pour supprimer un hashtag
router.delete("/:id", hashtagController.deleteHashtag);

// Route pour associer un hashtag à un actif
router.post("/actif", hashtagController.associateWithActif);

// Route pour dissocier un hashtag d'un actif
router.delete("/actif", hashtagController.dissociateFromActif);

// Route pour associer un hashtag à une licence
router.post("/license", hashtagController.associateWithLicense);

// Route pour dissocier un hashtag d'une licence
router.delete("/license", hashtagController.dissociateFromLicense);

// Route pour obtenir les actifs par hashtag
router.get("/actifs/:hashtagId", hashtagController.getActifsByHashtag);

// Route pour obtenir les licences par hashtag
router.get("/licenses/:hashtagId", hashtagController.getLicensesByHashtag);

router.post("/actifs", hashtagController.getActifsByMultipleHashtags);

// Route pour obtenir les licences par multiple hashtags
router.post(
  "/licenses",
  hashtagController.getLicensesByMultipleHashtags
);

export default router;
