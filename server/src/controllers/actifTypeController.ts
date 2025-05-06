import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const lagomPrisma = new PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL }}
  });

const insightPrisma = new PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL }}
  });

// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom" 
    ? lagomPrisma 
    : insightPrisma;
}




/**
 * Get all actifTypes with optional search by name
 */
export const getAllActifTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const search = req.query.search?.toString();

    // Find all actifTypes, optionally filtered by search query
    const actifTypes = await prisma.actifType.findMany({
      where: {
        nom: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      include: {
        category: true, // Include related category data
        _count: {
          select: { actifs: true }, // Count associated actifs
        },
      },
    });

    res.json(actifTypes);
  } catch (error) {
    console.error("Error retrieving all actifTypes:", error);
    res.status(500).json({ message: "Failed to retrieve actifTypes", error });
  }
};
/**
 * Get all actifTypes for a specific category or search by name
 */
export const getActifTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { categoryId } = req.params;
    const search = req.query.search?.toString();

    // Find actifTypes by categoryId and optionally by search query
    const actifTypes = await prisma.actifType.findMany({
      where: {
        categoryId,
        nom: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      include: {
        category: true, // Include related category data
        _count: {
          select: { actifs: true }, // Count associated actifs
        },
      },
    });

    res.json(actifTypes);
  } catch (error) {
    console.error("Error retrieving actifTypes:", error);
    res.status(500).json({ message: "Failed to retrieve actifTypes", error });
  }
};

/**
 * Get a single actifType by ID
 */
export const getActifTypeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifTypeId } = req.params;

    const actifType = await prisma.actifType.findUnique({
      where: { actifTypeId },
      include: {
        category: true, // Include related category
        actifs: true, // Include related actifs
      },
    });

    if (!actifType) {
      res.status(404).json({ message: "ActifType not found" });
      return;
    }

    res.json(actifType);
  } catch (error) {
    console.error("Error retrieving actifType:", error);
    res.status(500).json({ message: "Failed to retrieve actifType", error });
  }
};

/**
 * Create a new actifType for a specific category
 */
export const createActifType = async (
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

    // Check if an actifType with the same name already exists in this category
    const existingActifType = await prisma.actifType.findFirst({
      where: {
        categoryId,
        nom: {
          equals: nom,
          mode: "insensitive",
        },
      },
    });

    if (existingActifType) {
      res.status(409).json({
        message: "An actifType with this name already exists in this category",
      });
      return;
    }

    // Create the actifType with a generated UUID
    const actifType = await prisma.actifType.create({
      data: {
        actifTypeId: uuidv4(),
        nom,
        categoryId,
      },
      include: {
        category: true, // Include related category in response
      },
    });

    res.status(201).json(actifType);
  } catch (error) {
    console.error("Error creating actifType:", error);
    res.status(500).json({ message: "Error creating actifType", error });
  }
};

/**
 * Update an actifType by ID
 */
export const updateActifType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifTypeId } = req.params;
    const { nom } = req.body;

    // Validation
    if (!nom || typeof nom !== "string") {
      res.status(400).json({ message: "Valid name is required" });
      return;
    }

    // Check if the actifType exists
    const existingActifType = await prisma.actifType.findUnique({
      where: { actifTypeId },
      include: { category: true },
    });

    if (!existingActifType) {
      res.status(404).json({ message: "ActifType not found" });
      return;
    }

    // Check if another actifType with the same name already exists in this category
    const duplicateActifType = await prisma.actifType.findFirst({
      where: {
        categoryId: existingActifType.categoryId,
        nom: {
          equals: nom,
          mode: "insensitive",
        },
        actifTypeId: {
          not: actifTypeId, // Exclude the current actifType
        },
      },
    });

    if (duplicateActifType) {
      res.status(409).json({
        message:
          "Another actifType with this name already exists in this category",
      });
      return;
    }

    // Update the actifType
    const updatedActifType = await prisma.actifType.update({
      where: { actifTypeId },
      data: { nom },
      include: {
        category: true,
        actifs: true,
      },
    });

    res.status(200).json(updatedActifType);
  } catch (error) {
    console.error("Error updating actifType:", error);
    res.status(500).json({ message: "Error updating actifType", error });
  }
};

/**
 * Delete an actifType by ID
 */
export const deleteActifType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { actifTypeId } = req.params;

    // Check if the actifType exists
    const actifType = await prisma.actifType.findUnique({
      where: { actifTypeId },
      include: { actifs: true },
    });

    if (!actifType) {
      res.status(404).json({ message: "ActifType not found" });
      return;
    }

    // Check if there are any related actifs
    if (actifType.actifs.length > 0) {
      res.status(409).json({
        message: "Cannot delete actifType with associated actifs",
        count: actifType.actifs.length,
      });
      return;
    }

    // Delete the actifType
    await prisma.actifType.delete({
      where: { actifTypeId },
    });

    res.status(200).json({
      message: "ActifType deleted successfully",
      id: actifTypeId,
    });
  } catch (error) {
    console.error("Error deleting actifType:", error);
    res.status(500).json({ message: "Error deleting actifType", error });
  }
};
