"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashtagController = void 0;
const client_1 = require("@prisma/client");
const lagomPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
// Fonction pour générer un ID unique pour un hashtag
const generateHashtagId = () => {
    return `htg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
exports.hashtagController = {
    // Récupérer tous les hashtags
    getAllHashtags: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const prisma = getPrismaClient(req);
            const hashtags = yield prisma.hashtag.findMany();
            res.json(hashtags);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des hashtags:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la récupération des hashtags" });
        }
    }),
    // Créer un nouveau hashtag
    createHashtag: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ error: "Le nom du hashtag est requis" });
            return;
        }
        try {
            // Vérifier si le hashtag existe déjà
            const existingHashtag = yield prisma.hashtag.findFirst({
                where: { name },
            });
            if (existingHashtag) {
                res.status(409).json({ error: "Un hashtag avec ce nom existe déjà" });
                return;
            }
            // Créer le nouveau hashtag
            const newHashtag = yield prisma.hashtag.create({
                data: {
                    hashtagId: generateHashtagId(),
                    name,
                    description,
                },
            });
            res.status(201).json(newHashtag);
        }
        catch (error) {
            console.error("Erreur lors de la création du hashtag:", error);
            res.status(500).json({ error: "Erreur lors de la création du hashtag" });
        }
    }),
    // Récupérer un hashtag par son ID
    getHashtagById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { id } = req.params;
        try {
            const hashtag = yield prisma.hashtag.findUnique({
                where: { hashtagId: id },
                include: {
                    actifs: {
                        include: {
                            actif: true,
                        },
                    },
                    licenses: {
                        include: {
                            license: true,
                        },
                    },
                },
            });
            if (!hashtag) {
                res.status(404).json({ error: "Hashtag non trouvé" });
                return;
            }
            res.json(hashtag);
        }
        catch (error) {
            console.error("Erreur lors de la récupération du hashtag:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la récupération du hashtag" });
        }
    }),
    // Mettre à jour un hashtag
    updateHashtag: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { id } = req.params;
        const { name, description } = req.body;
        try {
            // Vérifier si le hashtag existe
            const existingHashtag = yield prisma.hashtag.findUnique({
                where: { hashtagId: id },
            });
            if (!existingHashtag) {
                res.status(404).json({ error: "Hashtag non trouvé" });
                return;
            }
            // Vérifier si le nouveau nom existe déjà (si le nom a changé)
            if (name && name !== existingHashtag.name) {
                const duplicateName = yield prisma.hashtag.findFirst({
                    where: { name },
                });
                if (duplicateName) {
                    res.status(409).json({ error: "Un hashtag avec ce nom existe déjà" });
                    return;
                }
            }
            // Mettre à jour le hashtag
            const updatedHashtag = yield prisma.hashtag.update({
                where: { hashtagId: id },
                data: {
                    name: name || existingHashtag.name,
                    description: description !== undefined
                        ? description
                        : existingHashtag.description,
                },
            });
            res.json(updatedHashtag);
        }
        catch (error) {
            console.error("Erreur lors de la mise à jour du hashtag:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la mise à jour du hashtag" });
        }
    }),
    // Supprimer un hashtag
    deleteHashtag: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { id } = req.params;
        try {
            // Vérifier si le hashtag existe
            const existingHashtag = yield prisma.hashtag.findUnique({
                where: { hashtagId: id },
            });
            if (!existingHashtag) {
                res.status(404).json({ error: "Hashtag non trouvé" });
                return;
            }
            // Supprimer d'abord toutes les relations avec les actifs et les licences
            yield prisma.$transaction([
                prisma.actifHashtag.deleteMany({
                    where: { hashtagId: id },
                }),
                prisma.licenseHashtag.deleteMany({
                    where: { hashtagId: id },
                }),
                prisma.hashtag.delete({
                    where: { hashtagId: id },
                }),
            ]);
            res.status(204).send();
        }
        catch (error) {
            console.error("Erreur lors de la suppression du hashtag:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la suppression du hashtag" });
        }
    }),
    // Rechercher des hashtags par nom
    searchHashtags: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { term } = req.params;
        try {
            const hashtags = yield prisma.hashtag.findMany({
                where: {
                    name: {
                        contains: term,
                        mode: "insensitive",
                    },
                },
            });
            res.json(hashtags);
        }
        catch (error) {
            console.error("Erreur lors de la recherche des hashtags:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la recherche des hashtags" });
        }
    }),
    // Associer un hashtag à un actif
    associateWithActif: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { actifId, hashtagId } = req.body;
        if (!actifId || !hashtagId) {
            res
                .status(400)
                .json({ error: "Les IDs d'actif et de hashtag sont requis" });
            return;
        }
        try {
            // Vérifier si l'actif existe
            const actif = yield prisma.actif.findUnique({
                where: { actifId },
            });
            if (!actif) {
                res.status(404).json({ error: "Actif non trouvé" });
                return;
            }
            // Vérifier si le hashtag existe
            const hashtag = yield prisma.hashtag.findUnique({
                where: { hashtagId },
            });
            if (!hashtag) {
                res.status(404).json({ error: "Hashtag non trouvé" });
                return;
            }
            // Vérifier si l'association existe déjà
            const existingAssociation = yield prisma.actifHashtag.findUnique({
                where: {
                    actifId_hashtagId: {
                        actifId,
                        hashtagId,
                    },
                },
            });
            if (existingAssociation) {
                res.status(409).json({ error: "Cette association existe déjà" });
                return;
            }
            // Créer l'association
            const association = yield prisma.actifHashtag.create({
                data: {
                    actifId,
                    hashtagId,
                },
                include: {
                    actif: true,
                    hashtag: true,
                },
            });
            res.status(201).json(association);
        }
        catch (error) {
            console.error("Erreur lors de l'association avec l'actif:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de l'association avec l'actif" });
        }
    }),
    // Dissocier un hashtag d'un actif
    dissociateFromActif: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { actifId, hashtagId } = req.body;
        if (!actifId || !hashtagId) {
            res
                .status(400)
                .json({ error: "Les IDs d'actif et de hashtag sont requis" });
            return;
        }
        try {
            // Vérifier si l'association existe
            const association = yield prisma.actifHashtag.findUnique({
                where: {
                    actifId_hashtagId: {
                        actifId,
                        hashtagId,
                    },
                },
            });
            if (!association) {
                res.status(404).json({ error: "Association non trouvée" });
                return;
            }
            // Supprimer l'association
            yield prisma.actifHashtag.delete({
                where: {
                    actifId_hashtagId: {
                        actifId,
                        hashtagId,
                    },
                },
            });
            res.status(204).send();
        }
        catch (error) {
            console.error("Erreur lors de la dissociation de l'actif:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la dissociation de l'actif" });
        }
    }),
    // Associer un hashtag à une licence
    associateWithLicense: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { licenseId, hashtagId } = req.body;
        if (!licenseId || !hashtagId) {
            res
                .status(400)
                .json({ error: "Les IDs de licence et de hashtag sont requis" });
            return;
        }
        try {
            // Vérifier si la licence existe
            const license = yield prisma.license.findUnique({
                where: { licenseId },
            });
            if (!license) {
                res.status(404).json({ error: "Licence non trouvée" });
                return;
            }
            // Vérifier si le hashtag existe
            const hashtag = yield prisma.hashtag.findUnique({
                where: { hashtagId },
            });
            if (!hashtag) {
                res.status(404).json({ error: "Hashtag non trouvé" });
                return;
            }
            // Vérifier si l'association existe déjà
            const existingAssociation = yield prisma.licenseHashtag.findUnique({
                where: {
                    licenseId_hashtagId: {
                        licenseId,
                        hashtagId,
                    },
                },
            });
            if (existingAssociation) {
                res.status(409).json({ error: "Cette association existe déjà" });
                return;
            }
            // Créer l'association
            const association = yield prisma.licenseHashtag.create({
                data: {
                    licenseId,
                    hashtagId,
                },
                include: {
                    license: true,
                    hashtag: true,
                },
            });
            res.status(201).json(association);
        }
        catch (error) {
            console.error("Erreur lors de l'association avec la licence:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de l'association avec la licence" });
        }
    }),
    // Dissocier un hashtag d'une licence
    dissociateFromLicense: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { licenseId, hashtagId } = req.body;
        if (!licenseId || !hashtagId) {
            res
                .status(400)
                .json({ error: "Les IDs de licence et de hashtag sont requis" });
            return;
        }
        try {
            // Vérifier si l'association existe
            const association = yield prisma.licenseHashtag.findUnique({
                where: {
                    licenseId_hashtagId: {
                        licenseId,
                        hashtagId,
                    },
                },
            });
            if (!association) {
                res.status(404).json({ error: "Association non trouvée" });
                return;
            }
            // Supprimer l'association
            yield prisma.licenseHashtag.delete({
                where: {
                    licenseId_hashtagId: {
                        licenseId,
                        hashtagId,
                    },
                },
            });
            res.status(204).send();
        }
        catch (error) {
            console.error("Erreur lors de la dissociation de la licence:", error);
            res
                .status(500)
                .json({ error: "Erreur lors de la dissociation de la licence" });
        }
    }),
    // Obtenir les actifs par hashtag
    getActifsByHashtag: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { hashtagId } = req.params;
        try {
            const actifs = yield prisma.actif.findMany({
                where: {
                    hashtags: {
                        some: {
                            hashtagId,
                        },
                    },
                },
                include: {
                    status: true,
                    etat: true,
                    actiftype: {
                        include: {
                            category: true,
                        },
                    },
                    specification: true,
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                    hashtags: {
                        include: {
                            hashtag: true,
                        },
                    },
                },
            });
            res.json(actifs);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des actifs par hashtag:", error);
            res.status(500).json({
                error: "Erreur lors de la récupération des actifs par hashtag",
            });
        }
    }),
    // Obtenir les licences par hashtag
    getLicensesByHashtag: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { hashtagId } = req.params;
        try {
            const licenses = yield prisma.license.findMany({
                where: {
                    hashtags: {
                        some: {
                            hashtagId,
                        },
                    },
                },
            });
            res.json(licenses);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des licences par hashtag:", error);
            res.status(500).json({
                error: "Erreur lors de la récupération des licences par hashtag",
            });
        }
    }),
    getActifsByMultipleHashtags: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { hashtagIds } = req.body; // Expect an array of hashtag IDs
        if (!hashtagIds || !Array.isArray(hashtagIds) || hashtagIds.length === 0) {
            res
                .status(400)
                .json({ error: "Un tableau d'IDs de hashtags est requis" });
            return;
        }
        try {
            // Find actifs that have ALL the specified hashtags
            const actifs = yield prisma.actif.findMany({
                where: {
                    AND: hashtagIds.map((hashtagId) => ({
                        hashtags: {
                            some: {
                                hashtagId,
                            },
                        },
                    })),
                },
                include: {
                    status: true,
                    etat: true,
                    actiftype: true,
                    specification: true,
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                    hashtags: {
                        include: {
                            hashtag: true,
                        },
                    },
                },
            });
            res.json(actifs);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des actifs par hashtags multiples:", error);
            res.status(500).json({
                error: "Erreur lors de la récupération des actifs par hashtags multiples",
            });
        }
    }),
    // Get licenses that have ALL the specified hashtags
    getLicensesByMultipleHashtags: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const prisma = getPrismaClient(req);
        const { hashtagIds } = req.body; // Expect an array of hashtag IDs
        if (!hashtagIds || !Array.isArray(hashtagIds) || hashtagIds.length === 0) {
            res
                .status(400)
                .json({ error: "Un tableau d'IDs de hashtags est requis" });
            return;
        }
        try {
            // Find licenses that have ALL the specified hashtags
            const licenses = yield prisma.license.findMany({
                where: {
                    AND: hashtagIds.map((hashtagId) => ({
                        hashtags: {
                            some: {
                                hashtagId,
                            },
                        },
                    })),
                },
                include: {
                    status: true,
                    etat: true,
                    licensetype: true,
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                    hashtags: {
                        include: {
                            hashtag: true,
                        },
                    },
                },
            });
            res.json(licenses);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des licenses par hashtags multiples:", error);
            res.status(500).json({
                error: "Erreur lors de la récupération des licenses par hashtags multiples",
            });
        }
    }),
};
