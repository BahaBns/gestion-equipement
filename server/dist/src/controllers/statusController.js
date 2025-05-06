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
exports.getStatusUsageStats = exports.deleteStatus = exports.createStatus = exports.updateLicenseStatus = exports.updateActifStatus = exports.getLicensesByStatus = exports.getActifsByStatus = exports.getAllStatuses = void 0;
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
 * Generate the next status ID
 */
const generateNextStatusId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
    // Fetch the last status from the database
    const lastStatus = yield prisma.status.findFirst({
        orderBy: {
            statusId: "desc",
        },
    });
    if (!lastStatus) {
        // If no statuses exist, start with "STA-1"
        return "STA-1";
    }
    // Extract the numeric part of the ID
    const lastIdNumber = parseInt(lastStatus.statusId.split("-")[1], 10);
    // Increment the numeric part and return the new ID
    return `STA-${lastIdNumber + 1}`;
});
/**
 * Get all statuses
 */
const getAllStatuses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Include count of associated actifs and licenses
        const statuses = yield prisma.status.findMany({
            include: {
                _count: {
                    select: {
                        actifs: true,
                        licenses: true,
                    },
                },
            },
        });
        console.log("Available statuses:", statuses);
        res.json(statuses);
    }
    catch (error) {
        console.error("Error retrieving statuses:", error);
        res.status(500).json({
            message: "Failed to retrieve statuses",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllStatuses = getAllStatuses;
/**
 * Get actifs by status
 */
const getActifsByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { statusId } = req.params;
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Get all actifs with the specified status
        const actifs = yield prisma.actif.findMany({
            where: { statusId },
            include: {
                actiftype: true, // Include actiftype instead of category
                status: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
                specification: true, // Include the specification relation
                attachments: true, // Include the attachments relation
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs by status:", error);
        res.status(500).json({
            message: "Failed to retrieve actifs by status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifsByStatus = getActifsByStatus;
/**
 * Get licenses by status
 */
const getLicensesByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { statusId } = req.params;
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Get all licenses with the specified status
        const licenses = yield prisma.license.findMany({
            where: { statusId },
            include: {
                licensetype: true,
                status: true,
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
        console.error("Error retrieving licenses by status:", error);
        res.status(500).json({
            message: "Failed to retrieve licenses by status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicensesByStatus = getLicensesByStatus;
/**
 * Update actif status
 */
const updateActifStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { statusId } = req.body;
        if (!statusId) {
            res.status(400).json({ message: "Status ID is required" });
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
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Update the actif status
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                statusId,
            },
            include: {
                status: true,
                actiftype: true,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif status:", error);
        res.status(500).json({
            message: "Failed to update actif status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifStatus = updateActifStatus;
/**
 * Update license status
 */
const updateLicenseStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { statusId } = req.body;
        if (!statusId) {
            res.status(400).json({ message: "Status ID is required" });
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
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Update the license status
        const updatedLicense = yield prisma.license.update({
            where: { licenseId },
            data: {
                statusId,
            },
            include: {
                status: true,
                licensetype: true,
            },
        });
        res.status(200).json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license status:", error);
        res.status(500).json({
            message: "Failed to update license status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateLicenseStatus = updateLicenseStatus;
/**
 * Create a new status
 */
const createStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ message: "Status name is required" });
            return;
        }
        // Check if status with the same name already exists
        const existingStatus = yield prisma.status.findUnique({
            where: { name },
        });
        if (existingStatus) {
            res.status(409).json({ message: "Status with this name already exists" });
            return;
        }
        // Generate the next status ID
        const statusId = yield generateNextStatusId(req);
        // Create the new status
        const newStatus = yield prisma.status.create({
            data: {
                statusId,
                name,
            },
        });
        res.status(201).json(newStatus);
    }
    catch (error) {
        console.error("Error creating status:", error);
        res.status(500).json({
            message: "Failed to create status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createStatus = createStatus;
/**
 * Delete a status
 */
const deleteStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { statusId } = req.params;
        // Check if the status exists with associated actifs and licenses
        const status = yield prisma.status.findUnique({
            where: { statusId },
            include: {
                actifs: true,
                licenses: true,
            },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Prevent deletion if status has associated actifs or licenses
        if (status.actifs.length > 0 || status.licenses.length > 0) {
            res.status(400).json({
                message: "Cannot delete status because it has associated actifs or licenses. Please reassign them first.",
            });
            return;
        }
        // Delete the status
        yield prisma.status.delete({
            where: { statusId },
        });
        res.status(200).json({ message: "Status deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting status:", error);
        res.status(500).json({
            message: "Failed to delete status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteStatus = deleteStatus;
/**
 * Get status usage statistics
 */
const getStatusUsageStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Get all statuses with counts of associated actifs and licenses
        const statuses = yield prisma.status.findMany();
        const statusStats = yield Promise.all(statuses.map((status) => __awaiter(void 0, void 0, void 0, function* () {
            // Count actifs with this status
            const actifCount = yield prisma.actif.count({
                where: { statusId: status.statusId },
            });
            // Count licenses with this status
            const licenseCount = yield prisma.license.count({
                where: { statusId: status.statusId },
            });
            return {
                statusId: status.statusId,
                name: status.name,
                totalActifs: actifCount,
                totalLicenses: licenseCount,
                totalItems: actifCount + licenseCount,
            };
        })));
        res.json(statusStats);
    }
    catch (error) {
        console.error("Error retrieving status usage statistics:", error);
        res.status(500).json({
            message: "Failed to retrieve status usage statistics",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getStatusUsageStats = getStatusUsageStats;
