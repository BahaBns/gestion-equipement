import { Request, Response } from "express";
import { Attachment, PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const lagomPrisma = 
  new PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
  })
;

const insightPrisma = 
  new PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
  })
;

// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, "../uploads/actifs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// File filter to limit file types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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
  } else {
    cb(new Error("Type de fichier non supporté"));
  }
};

// Configure multer upload
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Upload and attach file to an actif
 */
export const uploadAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifId } = req.params;

    // Check if actif exists
    const actif = await prisma.actif.findUnique({
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
    const attachment = await prisma.attachment.create({
      data: {
        attachmentId: `ATT-${Math.random().toString(36).substring(2, 9)}`,
        actifId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileUrl: relativePath,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({
      message: "Error uploading attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Upload multiple files to an actif
 */
export const uploadMultipleAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifId } = req.params;

    // Check if actif exists
    const actif = await prisma.actif.findUnique({
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

    const createdAttachments: Attachment[] = [];

    // Create a transaction to handle multiple attachments
    await prisma.$transaction(async (prismaClient) => {
      for (const file of req.files as Express.Multer.File[]) {
        // Create a relative path for storage in DB
        const relativePath = `/uploads/actifs/${file.filename}`;

        // Create a new attachment
        const attachment = await prismaClient.attachment.create({
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
    });

    res.status(201).json({
      message: `${createdAttachments.length} attachments uploaded successfully`,
      attachments: createdAttachments,
    });
  } catch (error) {
    console.error("Error uploading attachments:", error);
    res.status(500).json({
      message: "Error uploading attachments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { attachmentId },
    });

    if (!attachment) {
      res.status(404).json({ message: "Attachment not found" });
      return;
    }

    // Delete the physical file
    const filePath = path.join(__dirname, "..", attachment.fileUrl);

    // Check if file exists before trying to delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the database record
    await prisma.attachment.delete({
      where: { attachmentId },
    });

    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({
      message: "Error deleting attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all attachments for an actif
 */
export const getActifAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifId } = req.params;

    // Verify the actif exists
    const actif = await prisma.actif.findUnique({
      where: { actifId },
    });

    if (!actif) {
      res.status(404).json({ message: "Actif not found" });
      return;
    }

    // Get all attachments for the actif
    const attachments = await prisma.attachment.findMany({
      where: { actifId },
    });

    res.json(attachments);
  } catch (error) {
    console.error("Error retrieving attachments:", error);
    res.status(500).json({
      message: "Failed to retrieve attachments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Download an attachment
 */
export const downloadAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { attachmentId },
    });

    if (!attachment) {
      res.status(404).json({ message: "Attachment not found" });
      return;
    }

    // Construct the file path
    const filePath = path.join(__dirname, "..", attachment.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "File not found on server" });
      return;
    }

    // Set appropriate content type
    res.setHeader("Content-Type", attachment.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.fileName}"`
    );

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({
      message: "Error downloading attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
