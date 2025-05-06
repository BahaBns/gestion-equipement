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
exports.getSpecificationByActifId = exports.getAllSpecifications = exports.updateSpecification = void 0;
const client_1 = require("@prisma/client");
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
 * Update or create specification for an actif
 */
const updateSpecification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { ram, cpu, stockage, graphique } = req.body;
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Check if a specification already exists for this actif
        const existingSpec = yield prisma.specification.findUnique({
            where: { actifId },
        });
        let specification;
        if (existingSpec) {
            // Update existing specification
            specification = yield prisma.specification.update({
                where: { actifId },
                data: {
                    ram: ram !== undefined ? ram : existingSpec.ram,
                    cpu: cpu !== undefined ? cpu : existingSpec.cpu,
                    stockage: stockage !== undefined ? stockage : existingSpec.stockage,
                    graphique: graphique !== undefined ? graphique : existingSpec.graphique,
                },
            });
        }
        else {
            // Create new specification
            // Generate a unique specification ID
            const specificationId = `SPEC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            specification = yield prisma.specification.create({
                data: {
                    specificationId,
                    actifId,
                    ram,
                    cpu,
                    stockage,
                    graphique,
                },
            });
        }
        res.status(200).json(specification);
    }
    catch (error) {
        console.error("Error updating specification:", error);
        res.status(500).json({
            message: "Failed to update specification",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateSpecification = updateSpecification;
/**
 * Get all specifications
 */
const getAllSpecifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const specifications = yield prisma.specification.findMany({
            include: {
                actif: true,
            },
        });
        res.json(specifications);
    }
    catch (error) {
        console.error("Error retrieving specifications:", error);
        res.status(500).json({
            message: "Failed to retrieve specifications",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllSpecifications = getAllSpecifications;
/**
 * Get specification by actif ID
 */
const getSpecificationByActifId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const specification = yield prisma.specification.findUnique({
            where: { actifId },
            include: {
                actif: true,
            },
        });
        if (!specification) {
            res
                .status(404)
                .json({ message: "Specification not found for this actif" });
            return;
        }
        res.json(specification);
    }
    catch (error) {
        console.error("Error retrieving specification:", error);
        res.status(500).json({
            message: "Failed to retrieve specification",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getSpecificationByActifId = getSpecificationByActifId;
