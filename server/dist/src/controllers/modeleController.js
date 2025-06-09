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
exports.deleteModele = exports.updateModele = exports.createModele = exports.getModelesByMarque = exports.getModeles = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const lagomPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
/**
 * Get all modeles
 */
const getModeles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const modeles = yield prisma.modele.findMany({
            where: Object.assign({}, (search && {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        nomTechnique: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            })),
            include: {
                marque: true,
                _count: {
                    select: { actifs: true },
                },
            },
        });
        res.json(modeles);
    }
    catch (error) {
        console.error("Error retrieving modeles:", error);
        res.status(500).json({ message: "Failed to retrieve modeles" });
    }
});
exports.getModeles = getModeles;
/**
 * Get all modeles by marque
 */
const getModelesByMarque = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const { marqueId } = req.params;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        // Verify marque exists
        const marque = yield prisma.marque.findUnique({
            where: { marqueId },
        });
        if (!marque) {
            res.status(404).json({ message: "Marque not found" });
            return;
        }
        const modeles = yield prisma.modele.findMany({
            where: Object.assign({ marqueId }, (search && {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        nomTechnique: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            })),
            include: {
                marque: true,
                _count: {
                    select: { actifs: true },
                },
            },
        });
        res.json(modeles);
    }
    catch (error) {
        console.error("Error retrieving modeles:", error);
        res.status(500).json({ message: "Failed to retrieve modeles" });
    }
});
exports.getModelesByMarque = getModelesByMarque;
/**
 * Create a new modele
 */
const createModele = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { marqueId } = req.params;
        const { name, nomTechnique } = req.body;
        // Validate required fields
        if (!name) {
            res.status(400).json({ message: "Name is required" });
            return;
        }
        // Check if marque exists
        const marque = yield prisma.marque.findUnique({
            where: { marqueId },
        });
        if (!marque) {
            res.status(404).json({ message: "Marque not found" });
            return;
        }
        // Check for duplicates
        const existingModele = yield prisma.modele.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                marqueId,
            },
        });
        if (existingModele) {
            res.status(409).json({
                message: "A modele with this name already exists for this marque",
            });
            return;
        }
        // Create modele
        const modele = yield prisma.modele.create({
            data: {
                modeleId: `MOD-${(0, uuid_1.v4)().substring(0, 8)}`,
                name,
                nomTechnique: nomTechnique || null,
                marqueId,
            },
            include: {
                marque: true,
            },
        });
        res.status(201).json(modele);
    }
    catch (error) {
        console.error("Error creating modele:", error);
        res.status(500).json({ message: "Failed to create modele" });
    }
});
exports.createModele = createModele;
/**
 * Update a modele
 */
const updateModele = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { modeleId } = req.params;
        const { name, nomTechnique, marqueId } = req.body;
        // Validate
        if (!name) {
            res.status(400).json({ message: "Name is required" });
            return;
        }
        // Check if modele exists
        const modele = yield prisma.modele.findUnique({
            where: { modeleId },
        });
        if (!modele) {
            res.status(404).json({ message: "Modele not found" });
            return;
        }
        // If marqueId is changing, validate it
        if (marqueId && marqueId !== modele.marqueId) {
            const marque = yield prisma.marque.findUnique({
                where: { marqueId },
            });
            if (!marque) {
                res.status(404).json({ message: "Marque not found" });
                return;
            }
            // Check for duplicates in the new marque
            const existingModele = yield prisma.modele.findFirst({
                where: {
                    name: { equals: name, mode: "insensitive" },
                    marqueId,
                    modeleId: { not: modeleId },
                },
            });
            if (existingModele) {
                res.status(409).json({
                    message: "A modele with this name already exists for this marque",
                });
                return;
            }
        }
        else {
            // Check for duplicates in the same marque
            const existingModele = yield prisma.modele.findFirst({
                where: {
                    name: { equals: name, mode: "insensitive" },
                    marqueId: modele.marqueId,
                    modeleId: { not: modeleId },
                },
            });
            if (existingModele) {
                res.status(409).json({
                    message: "A modele with this name already exists for this marque",
                });
                return;
            }
        }
        // Update modele
        const updatedModele = yield prisma.modele.update({
            where: { modeleId },
            data: Object.assign({ name, nomTechnique: nomTechnique !== undefined ? nomTechnique : undefined }, (marqueId && { marqueId })),
            include: {
                marque: true,
            },
        });
        res.json(updatedModele);
    }
    catch (error) {
        console.error("Error updating modele:", error);
        res.status(500).json({ message: "Failed to update modele" });
    }
});
exports.updateModele = updateModele;
/**
 * Delete a modele
 */
const deleteModele = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { modeleId } = req.params;
        // Check if modele exists
        const modele = yield prisma.modele.findUnique({
            where: { modeleId },
            include: {
                actifs: true,
            },
        });
        if (!modele) {
            res.status(404).json({ message: "Modele not found" });
            return;
        }
        // Check if modele has associated actifs
        if (modele.actifs.length > 0) {
            res.status(409).json({
                message: "Cannot delete modele with associated actifs",
                count: modele.actifs.length,
            });
            return;
        }
        // Delete the modele
        yield prisma.modele.delete({
            where: { modeleId },
        });
        res.status(200).json({
            message: "Modele deleted successfully",
            id: modeleId,
        });
    }
    catch (error) {
        console.error("Error deleting modele:", error);
        res.status(500).json({ message: "Failed to delete modele" });
    }
});
exports.deleteModele = deleteModele;
