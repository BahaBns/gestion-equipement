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
exports.deleteMarque = exports.updateMarque = exports.createMarque = exports.getMarquesByActifType = exports.getMarques = void 0;
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
 * Get all marques
 */
const getMarques = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const marques = yield prisma.marque.findMany({
            where: search
                ? {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                }
                : undefined,
            include: {
                actifType: true,
                _count: {
                    select: { actifs: true },
                },
            },
        });
        res.json(marques);
    }
    catch (error) {
        console.error("Error retrieving marques:", error);
        res.status(500).json({ message: "Failed to retrieve marques" });
    }
});
exports.getMarques = getMarques;
/**
 * Get marques by actifType
 */
const getMarquesByActifType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifTypeId } = req.params;
        const marques = yield prisma.marque.findMany({
            where: { actifTypeId },
            include: {
                modeles: true,
            },
        });
        res.json(marques);
    }
    catch (error) {
        console.error("Error retrieving marques by actifType:", error);
        res
            .status(500)
            .json({ message: "Failed to retrieve marques by actifType" });
    }
});
exports.getMarquesByActifType = getMarquesByActifType;
/**
 * Create a new marque
 */
const createMarque = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { name, actifTypeId } = req.body;
        // Validate required fields
        if (!name || !actifTypeId) {
            res.status(400).json({ message: "Name and actifTypeId are required" });
            return;
        }
        // Check if actifType exists
        const actifType = yield prisma.actifType.findUnique({
            where: { actifTypeId },
        });
        if (!actifType) {
            res.status(404).json({ message: "ActifType not found" });
            return;
        }
        // Check for duplicates
        const existingMarque = yield prisma.marque.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                actifTypeId,
            },
        });
        if (existingMarque) {
            res.status(409).json({
                message: "A marque with this name already exists for this actifType",
            });
            return;
        }
        // Create marque
        const marque = yield prisma.marque.create({
            data: {
                marqueId: `MAR-${(0, uuid_1.v4)().substring(0, 8)}`,
                name,
                actifTypeId,
            },
            include: {
                actifType: true,
            },
        });
        res.status(201).json(marque);
    }
    catch (error) {
        console.error("Error creating marque:", error);
        res.status(500).json({ message: "Failed to create marque" });
    }
});
exports.createMarque = createMarque;
/**
 * Update a marque
 */
const updateMarque = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { marqueId } = req.params;
        const { name, actifTypeId } = req.body;
        // Validate
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
        // If actifTypeId is changing, validate it
        if (actifTypeId && actifTypeId !== marque.actifTypeId) {
            const actifType = yield prisma.actifType.findUnique({
                where: { actifTypeId },
            });
            if (!actifType) {
                res.status(404).json({ message: "ActifType not found" });
                return;
            }
            // Check for duplicates in the new actifType
            const existingMarque = yield prisma.marque.findFirst({
                where: {
                    name: { equals: name, mode: "insensitive" },
                    actifTypeId,
                    marqueId: { not: marqueId },
                },
            });
            if (existingMarque) {
                res.status(409).json({
                    message: "A marque with this name already exists for this actifType",
                });
                return;
            }
        }
        // Update marque
        const updatedMarque = yield prisma.marque.update({
            where: { marqueId },
            data: Object.assign({ name }, (actifTypeId && { actifTypeId })),
            include: {
                actifType: true,
            },
        });
        res.json(updatedMarque);
    }
    catch (error) {
        console.error("Error updating marque:", error);
        res.status(500).json({ message: "Failed to update marque" });
    }
});
exports.updateMarque = updateMarque;
/**
 * Delete a marque
 */
const deleteMarque = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { marqueId } = req.params;
        // Check if marque exists
        const marque = yield prisma.marque.findUnique({
            where: { marqueId },
            include: {
                actifs: true,
            },
        });
        if (!marque) {
            res.status(404).json({ message: "Marque not found" });
            return;
        }
        // Check if marque has associated actifs
        if (marque.actifs.length > 0) {
            res.status(409).json({
                message: "Cannot delete marque with associated actifs",
                count: marque.actifs.length,
            });
            return;
        }
        // Delete associated modeles first
        yield prisma.modele.deleteMany({
            where: { marqueId },
        });
        // Delete the marque
        yield prisma.marque.delete({
            where: { marqueId },
        });
        res.status(200).json({
            message: "Marque deleted successfully",
            id: marqueId,
        });
    }
    catch (error) {
        console.error("Erreur dans le supprission du marque:", error);
        res.status(500).json({ message: "Echec de suprimer le marque" });
    }
});
exports.deleteMarque = deleteMarque;
