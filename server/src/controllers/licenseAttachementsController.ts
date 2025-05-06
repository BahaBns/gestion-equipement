import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAutoTagMiddleware } from "../middleware/auto-tagMidlleware";

const lagomPrisma = setupAutoTagMiddleware(
  new PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
  })
);

const insightPrisma = setupAutoTagMiddleware(
  new PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
  })
);

// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

// Set up multer storage configuration for license attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads/licenses");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// Configure multer upload for single file
export const uploadSingle = multer({
  storage: storage,
});

/**
 * Upload and attach file to a license
 */
export const uploadLicenseAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                  const prisma = getPrismaClient(req);

    const { licenseId } = req.params;
    const file = req.file; // Get the uploaded file from multer middleware

    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Check if license exists
    const license = await prisma.license.findUnique({
      where: { licenseId },
    });

    if (!license) {
      // Delete the uploaded file since we won't be using it
      const filePath = path.join(process.cwd(), file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.status(404).json({ message: "License not found" });
      return;
    }

    // Create a relative path for storage in DB
    const relativePath = `/uploads/licenses/${file.filename}`;

    // Create a new license attachment
    const attachment = await prisma.licenseAttachment.create({
      data: {
        attachmentId: `LATT-${Math.random().toString(36).substring(2, 9)}`,
        licenseId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: relativePath,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error uploading license attachment:", error);
    res.status(500).json({
      message: "Error uploading license attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a license attachment
 */
export const deleteLicenseAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
              const prisma = getPrismaClient(req);

    const { attachmentId } = req.params;

    const attachment = await prisma.licenseAttachment.findUnique({
      where: { attachmentId },
    });

    if (!attachment) {
      res.status(404).json({ message: "License attachment not found" });
      return;
    }

    // Get the full file path
    const filePath = path.join(process.cwd(), attachment.fileUrl);

    // Delete the attachment from the database first
    await prisma.licenseAttachment.delete({
      where: { attachmentId },
    });

    // Then try to delete the physical file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res
      .status(200)
      .json({ message: "License attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting license attachment:", error);
    res.status(500).json({
      message: "Error deleting license attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Upload multiple attachments to a license
 */
export const uploadMultipleLicenseAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                  const prisma = getPrismaClient(req);

    const { licenseId } = req.params;
    const files = req.files as Express.Multer.File[]; // Get the uploaded files

    if (!files || files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    // Check if license exists
    const license = await prisma.license.findUnique({
      where: { licenseId },
    });

    if (!license) {
      // Delete any uploaded files since we won't be using them
      for (const file of files) {
        const filePath = path.join(process.cwd(), file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(404).json({ message: "License not found" });
      return;
    }

    // Create attachment records for each file
    const attachments = await Promise.all(
      files.map(async (file) => {
        // Create a relative path for storage in DB
        const relativePath = `/uploads/licenses/${file.filename}`;

        // Create a new license attachment
        return await prisma.licenseAttachment.create({
          data: {
            attachmentId: `LATT-${Math.random().toString(36).substring(2, 9)}`,
            licenseId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl: relativePath,
          },
        });
      })
    );

    res.status(201).json(attachments);
  } catch (error) {
    console.error("Error uploading license attachments:", error);
    res.status(500).json({
      message: "Error uploading license attachments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all attachments for a license
 */
export const getLicenseAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                  const prisma = getPrismaClient(req);

    const { licenseId } = req.params;

    // Verify the license exists
    const license = await prisma.license.findUnique({
      where: { licenseId },
    });

    if (!license) {
      res.status(404).json({ message: "License not found" });
      return;
    }

    // Get all attachments for the license
    const attachments = await prisma.licenseAttachment.findMany({
      where: { licenseId },
    });

    res.json(attachments);
  } catch (error) {
    console.error("Error retrieving license attachments:", error);
    res.status(500).json({
      message: "Failed to retrieve license attachments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single license attachment by ID
 */
export const getLicenseAttachmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                  const prisma = getPrismaClient(req);

    const { attachmentId } = req.params;

    const attachment = await prisma.licenseAttachment.findUnique({
      where: { attachmentId },
    });

    if (!attachment) {
      res.status(404).json({ message: "License attachment not found" });
      return;
    }

    res.json(attachment);
  } catch (error) {
    console.error("Error retrieving license attachment:", error);
    res.status(500).json({
      message: "Failed to retrieve license attachment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
