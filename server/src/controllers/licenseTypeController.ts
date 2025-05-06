import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
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


/**
 * Get all licenseTypes with optional search by name
 */
export const getAllLicenseTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const search = req.query.search?.toString();

    // Find all licenseTypes, optionally filtered by search query
    const licenseTypes = await prisma.licenseType.findMany({
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
  } catch (error) {
    console.error("Error retrieving all licenseTypes:", error);
    res.status(500).json({ message: "Failed to retrieve licenseTypes", error });
  }
};



/**
 * Get all licenseTypes for a specific category or search by name
 */
export const getLicenseTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
            const prisma = getPrismaClient(req);

    const { categoryId } = req.params;
    const search = req.query.search?.toString();

    // Find licenseTypes by categoryId and optionally by search query
    const licenseTypes = await prisma.licenseType.findMany({
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
  } catch (error) {
    console.error("Error retrieving licenseTypes:", error);
    res.status(500).json({ message: "Failed to retrieve licenseTypes", error });
  }
};

/**
 * Get a single licenseType by ID
 */
export const getLicenseTypeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
            const prisma = getPrismaClient(req);

    const { licenseTypeId } = req.params;

    const licenseType = await prisma.licenseType.findUnique({
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
  } catch (error) {
    console.error("Error retrieving licenseType:", error);
    res.status(500).json({ message: "Failed to retrieve licenseType", error });
  }
};

/**
 * Create a new licenseType for a specific category
 */
export const createLicenseType = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const categoryExists = await prisma.category.findUnique({
      where: { categoryId },
    });

    if (!categoryExists) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Check if a licenseType with the same name already exists in this category
    const existingLicenseType = await prisma.licenseType.findFirst({
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
    const licenseType = await prisma.licenseType.create({
      data: {
        licenseTypeId: uuidv4(),
        nom,
        categoryId,
      },
      include: {
        category: true, // Include related category in response
      },
    });

    res.status(201).json(licenseType);
  } catch (error) {
    console.error("Error creating licenseType:", error);
    res.status(500).json({ message: "Error creating licenseType", error });
  }
};

/**
 * Update a licenseType by ID
 */
export const updateLicenseType = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const existingLicenseType = await prisma.licenseType.findUnique({
      where: { licenseTypeId },
      include: { category: true },
    });

    if (!existingLicenseType) {
      res.status(404).json({ message: "LicenseType not found" });
      return;
    }

    // Check if another licenseType with the same name already exists in this category
    const duplicateLicenseType = await prisma.licenseType.findFirst({
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
        message:
          "Another licenseType with this name already exists in this category",
      });
      return;
    }

    // Update the licenseType
    const updatedLicenseType = await prisma.licenseType.update({
      where: { licenseTypeId },
      data: { nom },
      include: {
        category: true,
        licenses: true,
      },
    });

    res.status(200).json(updatedLicenseType);
  } catch (error) {
    console.error("Error updating licenseType:", error);
    res.status(500).json({ message: "Error updating licenseType", error });
  }
};

/**
 * Delete a licenseType by ID
 */
export const deleteLicenseType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
            const prisma = getPrismaClient(req);

    const { licenseTypeId } = req.params;

    // Check if the licenseType exists
    const licenseType = await prisma.licenseType.findUnique({
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
    await prisma.licenseType.delete({
      where: { licenseTypeId },
    });

    res.status(200).json({
      message: "LicenseType deleted successfully",
      id: licenseTypeId,
    });
  } catch (error) {
    console.error("Error deleting licenseType:", error);
    res.status(500).json({ message: "Error deleting licenseType", error });
  }
};