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
exports.getCategoryById = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
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
 * Generate the next category ID
 */
const generateNextCategoryId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
    // Fetch the last category from the database
    const lastCategory = yield prisma.category.findFirst({
        orderBy: {
            categoryId: "desc",
        },
    });
    if (!lastCategory) {
        // If no categories exist, start with "CAT-1"
        return "CAT-1";
    }
    // Extract the numeric part of the ID
    const lastIdNumber = parseInt(lastCategory.categoryId.split("-")[1], 10);
    // Increment the numeric part and return the new ID
    return `CAT-${lastIdNumber + 1}`;
});
/**
 * Get all categories or search categories by name
 */
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const categories = yield prisma.category.findMany({
            where: search
                ? {
                    nom: {
                        contains: search,
                    },
                }
                : undefined,
            include: {
                actiftype: true,
                licensetype: true, // Include related licenseType records
            },
        });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to retrieve categories" });
    }
});
exports.getCategories = getCategories;
/**
 * Create a new category
 */
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { nom } = req.body;
        // Generate the next category ID
        const categoryId = yield generateNextCategoryId(req);
        // Create the category with the generated ID
        const category = yield prisma.category.create({
            data: {
                categoryId, // Use the generated ID
                nom,
            },
        });
        // Return the created category
        res.status(201).json(category);
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Error creating category" });
    }
});
exports.createCategory = createCategory;
/**
 * Update a category by ID
 */
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        const { nom } = req.body;
        // Check if the category exists
        const existingCategory = yield prisma.category.findUnique({
            where: { categoryId: categoryId },
        });
        if (!existingCategory) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Update the category
        const updatedCategory = yield prisma.category.update({
            where: { categoryId: categoryId },
            data: { nom },
        });
        res.status(200).json(updatedCategory);
    }
    catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Error updating category" });
    }
});
exports.updateCategory = updateCategory;
/**
 * Delete a category by ID
 */
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        // Check if the category exists
        const category = yield prisma.category.findUnique({
            where: { categoryId: categoryId },
            include: {
                actiftype: true,
                licensetype: true, // Check related licenseType records
            },
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Prevent deletion if category has associated actifTypes or licenseTypes
        if (category.actiftype.length > 0 || category.licensetype.length > 0) {
            res.status(400).json({
                message: "Cannot delete category because it has associated actif types or license types. Please remove them first.",
            });
            return;
        }
        // Delete the category
        yield prisma.category.delete({
            where: { categoryId: categoryId },
        });
        res.status(200).json({ message: "Category deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Error deleting category" });
    }
});
exports.deleteCategory = deleteCategory;
/**
 * Get a category by ID with its related records
 */
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { categoryId } = req.params;
        const category = yield prisma.category.findUnique({
            where: { categoryId: categoryId },
            include: {
                actiftype: true,
                licensetype: true, // Include related licenseType records
            },
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.json(category);
    }
    catch (error) {
        console.error("Error retrieving category:", error);
        res.status(500).json({ message: "Error retrieving category" });
    }
});
exports.getCategoryById = getCategoryById;
