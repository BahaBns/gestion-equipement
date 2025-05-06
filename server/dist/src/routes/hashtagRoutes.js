"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/hashtagRoutes.js
const express_1 = __importDefault(require("express"));
const hashtagController_1 = require("../controllers/hashtagController");
const router = express_1.default.Router();
// Route pour récupérer tous les hashtags
router.get("/", hashtagController_1.hashtagController.getAllHashtags);
// Route pour créer un nouveau hashtag
router.post("/", hashtagController_1.hashtagController.createHashtag);
// Route pour rechercher des hashtags par terme
router.get("/search/:term", hashtagController_1.hashtagController.searchHashtags);
// Route pour récupérer un hashtag par son ID
router.get("/:id", hashtagController_1.hashtagController.getHashtagById);
// Route pour mettre à jour un hashtag
router.put("/:id", hashtagController_1.hashtagController.updateHashtag);
// Route pour supprimer un hashtag
router.delete("/:id", hashtagController_1.hashtagController.deleteHashtag);
// Route pour associer un hashtag à un actif
router.post("/actif", hashtagController_1.hashtagController.associateWithActif);
// Route pour dissocier un hashtag d'un actif
router.delete("/actif", hashtagController_1.hashtagController.dissociateFromActif);
// Route pour associer un hashtag à une licence
router.post("/license", hashtagController_1.hashtagController.associateWithLicense);
// Route pour dissocier un hashtag d'une licence
router.delete("/license", hashtagController_1.hashtagController.dissociateFromLicense);
// Route pour obtenir les actifs par hashtag
router.get("/actifs/:hashtagId", hashtagController_1.hashtagController.getActifsByHashtag);
// Route pour obtenir les licences par hashtag
router.get("/licenses/:hashtagId", hashtagController_1.hashtagController.getLicensesByHashtag);
router.post("/actifs", hashtagController_1.hashtagController.getActifsByMultipleHashtags);
// Route pour obtenir les licences par multiple hashtags
router.post("/licenses", hashtagController_1.hashtagController.getLicensesByMultipleHashtags);
exports.default = router;
