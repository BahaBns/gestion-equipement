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
exports.getEtatUsageStats = exports.deleteEtat = exports.createEtat = exports.updateLicenseEtat = exports.updateActifEtat = exports.getLicensesByEtat = exports.getActifsByEtat = exports.getAllEtats = void 0;
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
/**
 * Generate the next etat ID
 */
const generateNextEtatId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
    // Fetch the last etat from the database
    const lastEtat = yield prisma.etat.findFirst({
        orderBy: {
            etatId: "desc",
        },
    });
    if (!lastEtat) {
        // If no etats exist, start with "ETT-1"
        return "ETT-1";
    }
    // Extract the numeric part of the ID
    const lastIdNumber = parseInt(lastEtat.etatId.split("-")[1], 10);
    // Increment the numeric part and return the new ID
    return `ETT-${lastIdNumber + 1}`;
});
/**
 * Get all etats
 */
const getAllEtats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Include count of associated actifs and licenses
        const etats = yield prisma.etat.findMany({
            include: {
                _count: {
                    select: {
                        actifs: true,
                        licenses: true,
                    },
                },
            },
        });
        res.json(etats);
    }
    catch (error) {
        console.error("Error retrieving etats:", error);
        res.status(500).json({
            message: "Failed to retrieve etats",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllEtats = getAllEtats;
/**
 * Get actifs by etat
 */
const getActifsByEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { etatId } = req.params;
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Get all actifs with the specified etat
        const actifs = yield prisma.actif.findMany({
            where: { etatId },
            include: {
                actiftype: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
                specification: true,
                attachments: true,
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs by etat:", error);
        res.status(500).json({
            message: "Failed to retrieve actifs by etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifsByEtat = getActifsByEtat;
/**
 * Get licenses by etat
 */
const getLicensesByEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { etatId } = req.params;
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Get all licenses with the specified etat
        const licenses = yield prisma.license.findMany({
            where: { etatId },
            include: {
                licensetype: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
                attachments: true,
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedLicenses = licenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving licenses by etat:", error);
        res.status(500).json({
            message: "Failed to retrieve licenses by etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicensesByEtat = getLicensesByEtat;
/**
 * Update actif etat
 */
const updateActifEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { etatId } = req.body;
        if (!etatId) {
            res.status(400).json({ message: "Etat ID is required" });
            return;
        }
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Update the actif etat
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                etatId,
            },
            include: {
                etat: true,
                actiftype: true,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif etat:", error);
        res.status(500).json({
            message: "Failed to update actif etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifEtat = updateActifEtat;
/**
 * Update license etat
 */
const updateLicenseEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { etatId } = req.body;
        if (!etatId) {
            res.status(400).json({ message: "Etat ID is required" });
            return;
        }
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Update the license etat
        const updatedLicense = yield prisma.license.update({
            where: { licenseId },
            data: {
                etatId,
            },
            include: {
                etat: true,
                licensetype: true,
            },
        });
        res.status(200).json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license etat:", error);
        res.status(500).json({
            message: "Failed to update license etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateLicenseEtat = updateLicenseEtat;
/**
 * Create a new etat
 */
const createEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ message: "Etat name is required" });
            return;
        }
        // Check if etat with the same name already exists
        const existingEtat = yield prisma.etat.findUnique({
            where: { name },
        });
        if (existingEtat) {
            res.status(409).json({ message: "Etat with this name already exists" });
            return;
        }
        // Generate the next etat ID
        const etatId = yield generateNextEtatId(req);
        // Create the new etat
        const newEtat = yield prisma.etat.create({
            data: {
                etatId,
                name,
            },
        });
        res.status(201).json(newEtat);
    }
    catch (error) {
        console.error("Error creating etat:", error);
        res.status(500).json({
            message: "Failed to create etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createEtat = createEtat;
/**
 * Delete an etat
 */
const deleteEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { etatId } = req.params;
        // Check if the etat exists with associated actifs and licenses
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
            include: {
                actifs: true,
                licenses: true,
            },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Prevent deletion if etat has associated actifs or licenses
        if (etat.actifs.length > 0 || etat.licenses.length > 0) {
            res.status(400).json({
                message: "Cannot delete etat because it has associated actifs or licenses. Please reassign them first.",
            });
            return;
        }
        // Delete the etat
        yield prisma.etat.delete({
            where: { etatId },
        });
        res.status(200).json({ message: "Etat deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting etat:", error);
        res.status(500).json({
            message: "Failed to delete etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteEtat = deleteEtat;
/**
 * Get etat usage statistics
 */
const getEtatUsageStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Get all etats with counts of associated actifs and licenses
        const etats = yield prisma.etat.findMany();
        const etatStats = yield Promise.all(etats.map((etat) => __awaiter(void 0, void 0, void 0, function* () {
            // Count actifs with this etat
            const actifCount = yield prisma.actif.count({
                where: { etatId: etat.etatId },
            });
            // Count licenses with this etat
            const licenseCount = yield prisma.license.count({
                where: { etatId: etat.etatId },
            });
            return {
                etatId: etat.etatId,
                name: etat.name,
                totalActifs: actifCount,
                totalLicenses: licenseCount,
                totalItems: actifCount + licenseCount,
            };
        })));
        res.json(etatStats);
    }
    catch (error) {
        console.error("Error retrieving etat usage statistics:", error);
        res.status(500).json({
            message: "Failed to retrieve etat usage statistics",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getEtatUsageStats = getEtatUsageStats;
