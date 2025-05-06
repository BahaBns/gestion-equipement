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
exports.deleteFournisseur = exports.updateFournisseur = exports.createFournisseur = exports.getFournisseurById = exports.getFournisseurs = void 0;
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
 * Get all fournisseurs
 */
const getFournisseurs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const fournisseurs = yield prisma.fournisseur.findMany({
            where: search
                ? {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                }
                : undefined,
            include: {
                _count: {
                    select: { actifs: true },
                },
            },
        });
        res.json(fournisseurs);
    }
    catch (error) {
        console.error("Error retrieving fournisseurs:", error);
        res.status(500).json({ message: "Failed to retrieve fournisseurs" });
    }
});
exports.getFournisseurs = getFournisseurs;
/**
 * Get fournisseur by ID
 */
const getFournisseurById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { fournisseurId } = req.params;
        const fournisseur = yield prisma.fournisseur.findUnique({
            where: { fournisseurId },
            include: {
                actifs: {
                    take: 10, // Limit to 10 actifs
                },
                _count: {
                    select: { actifs: true },
                },
            },
        });
        if (!fournisseur) {
            res.status(404).json({ message: "Fournisseur not found" });
            return;
        }
        res.json(fournisseur);
    }
    catch (error) {
        console.error("Error retrieving fournisseur:", error);
        res.status(500).json({ message: "Failed to retrieve fournisseur" });
    }
});
exports.getFournisseurById = getFournisseurById;
/**
 * Create a new fournisseur
 */
const createFournisseur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { name, email, phone } = req.body;
        // Validate required fields
        if (!name) {
            res.status(400).json({ message: "Name is required" });
            return;
        }
        // Check for duplicates
        const existingFournisseur = yield prisma.fournisseur.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
            },
        });
        if (existingFournisseur) {
            res
                .status(409)
                .json({ message: "A fournisseur with this name already exists" });
            return;
        }
        // Create fournisseur with the new fields
        const fournisseurId = `FOUR-${(0, uuid_1.v4)().substring(0, 8)}`;
        const fournisseur = yield prisma.fournisseur.create({
            data: {
                fournisseurId,
                name,
                email,
                phone,
            },
        });
        res.status(201).json(fournisseur);
    }
    catch (error) {
        console.error("Error creating fournisseur:", error);
        res.status(500).json({ message: "Failed to create fournisseur" });
    }
});
exports.createFournisseur = createFournisseur;
/**
 * Update a fournisseur
 */
const updateFournisseur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { fournisseurId } = req.params;
        const { name, email, phone } = req.body;
        // Validate
        if (!name) {
            res.status(400).json({ message: "Name is required" });
            return;
        }
        // Check if fournisseur exists
        const fournisseur = yield prisma.fournisseur.findUnique({
            where: { fournisseurId },
        });
        if (!fournisseur) {
            res.status(404).json({ message: "Fournisseur not found" });
            return;
        }
        // Check for duplicates
        if (name !== fournisseur.name) {
            const existingFournisseur = yield prisma.fournisseur.findFirst({
                where: {
                    name: { equals: name, mode: "insensitive" },
                    fournisseurId: { not: fournisseurId },
                },
            });
            if (existingFournisseur) {
                res.status(409).json({
                    message: "Another fournisseur with this name already exists",
                });
                return;
            }
        }
        // Update fournisseur
        const updatedFournisseur = yield prisma.fournisseur.update({
            where: { fournisseurId },
            data: {
                name,
                email,
                phone,
            },
        });
        res.json(updatedFournisseur);
    }
    catch (error) {
        console.error("Error updating fournisseur:", error);
        res.status(500).json({ message: "Failed to update fournisseur" });
    }
});
exports.updateFournisseur = updateFournisseur;
/**
 * Delete a fournisseur
 */
const deleteFournisseur = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { fournisseurId } = req.params;
        // Check if fournisseur exists
        const fournisseur = yield prisma.fournisseur.findUnique({
            where: { fournisseurId },
            include: {
                actifs: true,
            },
        });
        if (!fournisseur) {
            res.status(404).json({ message: "Fournisseur not found" });
            return;
        }
        // Check if fournisseur has associated actifs
        if (fournisseur.actifs.length > 0) {
            res.status(409).json({
                message: "Cannot delete fournisseur with associated actifs",
                count: fournisseur.actifs.length,
            });
            return;
        }
        // Delete the fournisseur
        yield prisma.fournisseur.delete({
            where: { fournisseurId },
        });
        res.status(200).json({
            message: "Fournisseur deleted successfully",
            id: fournisseurId,
        });
    }
    catch (error) {
        console.error("Error deleting fournisseur:", error);
        res.status(500).json({ message: "Failed to delete fournisseur" });
    }
});
exports.deleteFournisseur = deleteFournisseur;
