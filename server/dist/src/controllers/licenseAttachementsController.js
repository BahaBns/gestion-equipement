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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLicenseAttachmentById = exports.getLicenseAttachments = exports.uploadMultipleLicenseAttachments = exports.deleteLicenseAttachment = exports.uploadLicenseAttachment = exports.uploadSingle = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
// Set up multer storage configuration for license attachments
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(process.cwd(), "uploads/licenses");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename);
    },
});
// Configure multer upload for single file
exports.uploadSingle = (0, multer_1.default)({
    storage: storage,
});
/**
 * Upload and attach file to a license
 */
const uploadLicenseAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const file = req.file; // Get the uploaded file from multer middleware
        if (!file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Check if license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            // Delete the uploaded file since we won't be using it
            const filePath = path_1.default.join(process.cwd(), file.path);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Create a relative path for storage in DB
        const relativePath = `/uploads/licenses/${file.filename}`;
        // Create a new license attachment
        const attachment = yield prisma.licenseAttachment.create({
            data: {
                attachmentId: `LATT-${Math.random().toString(36).substring(2, 9)}`,
                licenseId,
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: relativePath,
            },
        });
        res.status(201).json(attachment);
    }
    catch (error) {
        console.error("Error uploading license attachment:", error);
        res.status(500).json({
            message: "Error uploading license attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadLicenseAttachment = uploadLicenseAttachment;
/**
 * Delete a license attachment
 */
const deleteLicenseAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { attachmentId } = req.params;
        const attachment = yield prisma.licenseAttachment.findUnique({
            where: { attachmentId },
        });
        if (!attachment) {
            res.status(404).json({ message: "License attachment not found" });
            return;
        }
        // Get the full file path
        const filePath = path_1.default.join(process.cwd(), attachment.fileUrl);
        // Delete the attachment from the database first
        yield prisma.licenseAttachment.delete({
            where: { attachmentId },
        });
        // Then try to delete the physical file if it exists
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        res
            .status(200)
            .json({ message: "License attachment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting license attachment:", error);
        res.status(500).json({
            message: "Error deleting license attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteLicenseAttachment = deleteLicenseAttachment;
/**
 * Upload multiple attachments to a license
 */
const uploadMultipleLicenseAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const files = req.files; // Get the uploaded files
        if (!files || files.length === 0) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }
        // Check if license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            // Delete any uploaded files since we won't be using them
            for (const file of files) {
                const filePath = path_1.default.join(process.cwd(), file.path);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Create attachment records for each file
        const attachments = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            // Create a relative path for storage in DB
            const relativePath = `/uploads/licenses/${file.filename}`;
            // Create a new license attachment
            return yield prisma.licenseAttachment.create({
                data: {
                    attachmentId: `LATT-${Math.random().toString(36).substring(2, 9)}`,
                    licenseId,
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    fileUrl: relativePath,
                },
            });
        })));
        res.status(201).json(attachments);
    }
    catch (error) {
        console.error("Error uploading license attachments:", error);
        res.status(500).json({
            message: "Error uploading license attachments",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadMultipleLicenseAttachments = uploadMultipleLicenseAttachments;
/**
 * Get all attachments for a license
 */
const getLicenseAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Get all attachments for the license
        const attachments = yield prisma.licenseAttachment.findMany({
            where: { licenseId },
        });
        res.json(attachments);
    }
    catch (error) {
        console.error("Error retrieving license attachments:", error);
        res.status(500).json({
            message: "Failed to retrieve license attachments",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicenseAttachments = getLicenseAttachments;
/**
 * Get a single license attachment by ID
 */
const getLicenseAttachmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { attachmentId } = req.params;
        const attachment = yield prisma.licenseAttachment.findUnique({
            where: { attachmentId },
        });
        if (!attachment) {
            res.status(404).json({ message: "License attachment not found" });
            return;
        }
        res.json(attachment);
    }
    catch (error) {
        console.error("Error retrieving license attachment:", error);
        res.status(500).json({
            message: "Failed to retrieve license attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicenseAttachmentById = getLicenseAttachmentById;
