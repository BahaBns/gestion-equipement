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
exports.deleteActifType = exports.updateActifType = exports.createActifType = exports.getActifTypeById = exports.getActifTypes = exports.getAllActifTypes = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const lagomPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } }
});
const insightPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } }
});
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
/**
 * Get all actifTypes with optional search by name
 */
const getAllActifTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        // Find all actifTypes, optionally filtered by search query
        const actifTypes = yield prisma.actifType.findMany({
            where: {
                nom: search ? { contains: search, mode: "insensitive" } : undefined,
            },
            include: {
                category: true, // Include related category data
                _count: {
                    select: { actifs: true }, // Count associated actifs
                },
            },
        });
        res.json(actifTypes);
    }
    catch (error) {
        console.error("Error retrieving all actifTypes:", error);
        res.status(500).json({ message: "Failed to retrieve actifTypes", error });
    }
});
exports.getAllActifTypes = getAllActifTypes;
/**
 * Get all actifTypes for a specific category or search by name
 */
const getActifTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        // Find actifTypes by categoryId and optionally by search query
        const actifTypes = yield prisma.actifType.findMany({
            where: {
                categoryId,
                nom: search ? { contains: search, mode: "insensitive" } : undefined,
            },
            include: {
                category: true, // Include related category data
                _count: {
                    select: { actifs: true }, // Count associated actifs
                },
            },
        });
        res.json(actifTypes);
    }
    catch (error) {
        console.error("Error retrieving actifTypes:", error);
        res.status(500).json({ message: "Failed to retrieve actifTypes", error });
    }
});
exports.getActifTypes = getActifTypes;
/**
 * Get a single actifType by ID
 */
const getActifTypeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifTypeId } = req.params;
        const actifType = yield prisma.actifType.findUnique({
            where: { actifTypeId },
            include: {
                category: true, // Include related category
                actifs: true, // Include related actifs
            },
        });
        if (!actifType) {
            res.status(404).json({ message: "ActifType not found" });
            return;
        }
        res.json(actifType);
    }
    catch (error) {
        console.error("Error retrieving actifType:", error);
        res.status(500).json({ message: "Failed to retrieve actifType", error });
    }
});
exports.getActifTypeById = getActifTypeById;
/**
 * Create a new actifType for a specific category
 */
const createActifType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        const { nom } = req.body;
        // Validation
        if (!nom || typeof nom !== "string") {
            res.status(400).json({ message: "Valid name is required" });
            return;
        }
        // Check if the category exists
        const categoryExists = yield prisma.category.findUnique({
            where: { categoryId },
        });
        if (!categoryExists) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Check if an actifType with the same name already exists in this category
        const existingActifType = yield prisma.actifType.findFirst({
            where: {
                categoryId,
                nom: {
                    equals: nom,
                    mode: "insensitive",
                },
            },
        });
        if (existingActifType) {
            res.status(409).json({
                message: "An actifType with this name already exists in this category",
            });
            return;
        }
        // Create the actifType with a generated UUID
        const actifType = yield prisma.actifType.create({
            data: {
                actifTypeId: (0, uuid_1.v4)(),
                nom,
                categoryId,
            },
            include: {
                category: true, // Include related category in response
            },
        });
        res.status(201).json(actifType);
    }
    catch (error) {
        console.error("Error creating actifType:", error);
        res.status(500).json({ message: "Error creating actifType", error });
    }
});
exports.createActifType = createActifType;
/**
 * Update an actifType by ID
 */
const updateActifType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifTypeId } = req.params;
        const { nom } = req.body;
        // Validation
        if (!nom || typeof nom !== "string") {
            res.status(400).json({ message: "Valid name is required" });
            return;
        }
        // Check if the actifType exists
        const existingActifType = yield prisma.actifType.findUnique({
            where: { actifTypeId },
            include: { category: true },
        });
        if (!existingActifType) {
            res.status(404).json({ message: "ActifType not found" });
            return;
        }
        // Check if another actifType with the same name already exists in this category
        const duplicateActifType = yield prisma.actifType.findFirst({
            where: {
                categoryId: existingActifType.categoryId,
                nom: {
                    equals: nom,
                    mode: "insensitive",
                },
                actifTypeId: {
                    not: actifTypeId, // Exclude the current actifType
                },
            },
        });
        if (duplicateActifType) {
            res.status(409).json({
                message: "Another actifType with this name already exists in this category",
            });
            return;
        }
        // Update the actifType
        const updatedActifType = yield prisma.actifType.update({
            where: { actifTypeId },
            data: { nom },
            include: {
                category: true,
                actifs: true,
            },
        });
        res.status(200).json(updatedActifType);
    }
    catch (error) {
        console.error("Error updating actifType:", error);
        res.status(500).json({ message: "Error updating actifType", error });
    }
});
exports.updateActifType = updateActifType;
/**
 * Delete an actifType by ID
 */
const deleteActifType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifTypeId } = req.params;
        // Check if the actifType exists
        const actifType = yield prisma.actifType.findUnique({
            where: { actifTypeId },
            include: { actifs: true },
        });
        if (!actifType) {
            res.status(404).json({ message: "ActifType not found" });
            return;
        }
        // Check if there are any related actifs
        if (actifType.actifs.length > 0) {
            res.status(409).json({
                message: "Cannot delete actifType with associated actifs",
                count: actifType.actifs.length,
            });
            return;
        }
        // Delete the actifType
        yield prisma.actifType.delete({
            where: { actifTypeId },
        });
        res.status(200).json({
            message: "ActifType deleted successfully",
            id: actifTypeId,
        });
    }
    catch (error) {
        console.error("Error deleting actifType:", error);
        res.status(500).json({ message: "Error deleting actifType", error });
    }
});
exports.deleteActifType = deleteActifType;
