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
exports.deleteLicenseType = exports.updateLicenseType = exports.createLicenseType = exports.getLicenseTypeById = exports.getLicenseTypes = exports.getAllLicenseTypes = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const auto_tagMidlleware_1 = require("../middleware/auto-tagMidlleware");
const lagomPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
}));
const insightPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
}));
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
/**
 * Get all licenseTypes with optional search by name
 */
const getAllLicenseTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        // Find all licenseTypes, optionally filtered by search query
        const licenseTypes = yield prisma.licenseType.findMany({
            where: {
                nom: search ? { contains: search, mode: "insensitive" } : undefined,
            },
            include: {
                category: true, // Include related category data
                _count: {
                    select: { licenses: true }, // Count associated licenses
                },
            },
        });
        res.json(licenseTypes);
    }
    catch (error) {
        console.error("Error retrieving all licenseTypes:", error);
        res.status(500).json({ message: "Failed to retrieve licenseTypes", error });
    }
});
exports.getAllLicenseTypes = getAllLicenseTypes;
/**
 * Get all licenseTypes for a specific category or search by name
 */
const getLicenseTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        // Find licenseTypes by categoryId and optionally by search query
        const licenseTypes = yield prisma.licenseType.findMany({
            where: {
                categoryId,
                nom: search ? { contains: search, mode: "insensitive" } : undefined,
            },
            include: {
                category: true, // Include related category data
                _count: {
                    select: { licenses: true }, // Count associated licenses
                },
            },
        });
        res.json(licenseTypes);
    }
    catch (error) {
        console.error("Error retrieving licenseTypes:", error);
        res.status(500).json({ message: "Failed to retrieve licenseTypes", error });
    }
});
exports.getLicenseTypes = getLicenseTypes;
/**
 * Get a single licenseType by ID
 */
const getLicenseTypeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseTypeId } = req.params;
        const licenseType = yield prisma.licenseType.findUnique({
            where: { licenseTypeId },
            include: {
                category: true, // Include related category
                licenses: true, // Include related licenses
            },
        });
        if (!licenseType) {
            res.status(404).json({ message: "LicenseType not found" });
            return;
        }
        res.json(licenseType);
    }
    catch (error) {
        console.error("Error retrieving licenseType:", error);
        res.status(500).json({ message: "Failed to retrieve licenseType", error });
    }
});
exports.getLicenseTypeById = getLicenseTypeById;
/**
 * Create a new licenseType for a specific category
 */
const createLicenseType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Check if a licenseType with the same name already exists in this category
        const existingLicenseType = yield prisma.licenseType.findFirst({
            where: {
                categoryId,
                nom: {
                    equals: nom,
                    mode: "insensitive",
                },
            },
        });
        if (existingLicenseType) {
            res.status(409).json({
                message: "A licenseType with this name already exists in this category",
            });
            return;
        }
        // Create the licenseType with a generated UUID
        const licenseType = yield prisma.licenseType.create({
            data: {
                licenseTypeId: (0, uuid_1.v4)(),
                nom,
                categoryId,
            },
            include: {
                category: true, // Include related category in response
            },
        });
        res.status(201).json(licenseType);
    }
    catch (error) {
        console.error("Error creating licenseType:", error);
        res.status(500).json({ message: "Error creating licenseType", error });
    }
});
exports.createLicenseType = createLicenseType;
/**
 * Update a licenseType by ID
 */
const updateLicenseType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseTypeId } = req.params;
        const { nom } = req.body;
        // Validation
        if (!nom || typeof nom !== "string") {
            res.status(400).json({ message: "Valid name is required" });
            return;
        }
        // Check if the licenseType exists
        const existingLicenseType = yield prisma.licenseType.findUnique({
            where: { licenseTypeId },
            include: { category: true },
        });
        if (!existingLicenseType) {
            res.status(404).json({ message: "LicenseType not found" });
            return;
        }
        // Check if another licenseType with the same name already exists in this category
        const duplicateLicenseType = yield prisma.licenseType.findFirst({
            where: {
                categoryId: existingLicenseType.categoryId,
                nom: {
                    equals: nom,
                    mode: "insensitive",
                },
                licenseTypeId: {
                    not: licenseTypeId, // Exclude the current licenseType
                },
            },
        });
        if (duplicateLicenseType) {
            res.status(409).json({
                message: "Another licenseType with this name already exists in this category",
            });
            return;
        }
        // Update the licenseType
        const updatedLicenseType = yield prisma.licenseType.update({
            where: { licenseTypeId },
            data: { nom },
            include: {
                category: true,
                licenses: true,
            },
        });
        res.status(200).json(updatedLicenseType);
    }
    catch (error) {
        console.error("Error updating licenseType:", error);
        res.status(500).json({ message: "Error updating licenseType", error });
    }
});
exports.updateLicenseType = updateLicenseType;
/**
 * Delete a licenseType by ID
 */
const deleteLicenseType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseTypeId } = req.params;
        // Check if the licenseType exists
        const licenseType = yield prisma.licenseType.findUnique({
            where: { licenseTypeId },
            include: { licenses: true },
        });
        if (!licenseType) {
            res.status(404).json({ message: "LicenseType not found" });
            return;
        }
        // Check if there are any related licenses
        if (licenseType.licenses.length > 0) {
            res.status(409).json({
                message: "Cannot delete licenseType with associated licenses",
                count: licenseType.licenses.length,
            });
            return;
        }
        // Delete the licenseType
        yield prisma.licenseType.delete({
            where: { licenseTypeId },
        });
        res.status(200).json({
            message: "LicenseType deleted successfully",
            id: licenseTypeId,
        });
    }
    catch (error) {
        console.error("Error deleting licenseType:", error);
        res.status(500).json({ message: "Error deleting licenseType", error });
    }
});
exports.deleteLicenseType = deleteLicenseType;
