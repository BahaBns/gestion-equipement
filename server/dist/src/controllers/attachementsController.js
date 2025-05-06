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
exports.downloadAttachment = exports.getActifAttachments = exports.deleteAttachment = exports.uploadMultipleAttachments = exports.uploadAttachment = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
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
// Set up multer storage configuration
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = path_1.default.join(__dirname, "../uploads/actifs");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueFilename = `${(0, uuid_1.v4)()}-${file.originalname}`;
        cb(null, uniqueFilename);
    },
});
// File filter to limit file types
const fileFilter = (req, file, cb) => {
    // Accept images, PDFs, Office documents, and text files
    const allowedFileTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
    ];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Type de fichier non supporté"));
    }
};
// Configure multer upload
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});
/**
 * Upload and attach file to an actif
 */
const uploadAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        // Check if actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Handle file upload (should be processed by multer middleware)
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Create a relative path for storage in DB
        const relativePath = `/uploads/actifs/${req.file.filename}`;
        // Create a new attachment
        const attachment = yield prisma.attachment.create({
            data: {
                attachmentId: `ATT-${Math.random().toString(36).substring(2, 9)}`,
                actifId,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileUrl: relativePath,
            },
        });
        res.status(201).json(attachment);
    }
    catch (error) {
        console.error("Error uploading attachment:", error);
        res.status(500).json({
            message: "Error uploading attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadAttachment = uploadAttachment;
/**
 * Upload multiple files to an actif
 */
const uploadMultipleAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        // Check if actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Handle file uploads (should be processed by multer middleware)
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }
        const createdAttachments = [];
        // Create a transaction to handle multiple attachments
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            for (const file of req.files) {
                // Create a relative path for storage in DB
                const relativePath = `/uploads/actifs/${file.filename}`;
                // Create a new attachment
                const attachment = yield prismaClient.attachment.create({
                    data: {
                        attachmentId: `ATT-${Math.random().toString(36).substring(2, 9)}`,
                        actifId,
                        fileName: file.originalname,
                        fileType: file.mimetype,
                        fileUrl: relativePath,
                    },
                });
                createdAttachments.push(attachment);
            }
        }));
        res.status(201).json({
            message: `${createdAttachments.length} attachments uploaded successfully`,
            attachments: createdAttachments,
        });
    }
    catch (error) {
        console.error("Error uploading attachments:", error);
        res.status(500).json({
            message: "Error uploading attachments",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadMultipleAttachments = uploadMultipleAttachments;
/**
 * Delete an attachment
 */
const deleteAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { attachmentId } = req.params;
        const attachment = yield prisma.attachment.findUnique({
            where: { attachmentId },
        });
        if (!attachment) {
            res.status(404).json({ message: "Attachment not found" });
            return;
        }
        // Delete the physical file
        const filePath = path_1.default.join(__dirname, "..", attachment.fileUrl);
        // Check if file exists before trying to delete
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete the database record
        yield prisma.attachment.delete({
            where: { attachmentId },
        });
        res.status(200).json({ message: "Attachment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({
            message: "Error deleting attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteAttachment = deleteAttachment;
/**
 * Get all attachments for an actif
 */
const getActifAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Get all attachments for the actif
        const attachments = yield prisma.attachment.findMany({
            where: { actifId },
        });
        res.json(attachments);
    }
    catch (error) {
        console.error("Error retrieving attachments:", error);
        res.status(500).json({
            message: "Failed to retrieve attachments",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifAttachments = getActifAttachments;
/**
 * Download an attachment
 */
const downloadAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { attachmentId } = req.params;
        const attachment = yield prisma.attachment.findUnique({
            where: { attachmentId },
        });
        if (!attachment) {
            res.status(404).json({ message: "Attachment not found" });
            return;
        }
        // Construct the file path
        const filePath = path_1.default.join(__dirname, "..", attachment.fileUrl);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ message: "File not found on server" });
            return;
        }
        // Set appropriate content type
        res.setHeader("Content-Type", attachment.fileType);
        res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
        // Stream the file to the response
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error("Error downloading attachment:", error);
        res.status(500).json({
            message: "Error downloading attachment",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.downloadAttachment = downloadAttachment;
