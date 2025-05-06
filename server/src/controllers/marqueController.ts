import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const lagomPrisma = new PrismaClient({
  datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new PrismaClient({
  datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});

function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

/**
 * Get all marques
 */
export const getMarques = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const search = req.query.search?.toString();

    const marques = await prisma.marque.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      include: {
        actifType: true,
        _count: {
          select: { actifs: true },
        },
      },
    });

    res.json(marques);
  } catch (error) {
    console.error("Error retrieving marques:", error);
    res.status(500).json({ message: "Failed to retrieve marques" });
  }
};

/**
 * Get marques by actifType
 */
export const getMarquesByActifType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { actifTypeId } = req.params;

    const marques = await prisma.marque.findMany({
      where: { actifTypeId },
      include: {
        modeles: true,
      },
    });

    res.json(marques);
  } catch (error) {
    console.error("Error retrieving marques by actifType:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve marques by actifType" });
  }
};

/**
 * Create a new marque
 */
export const createMarque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { name, actifTypeId } = req.body;

    // Validate required fields
    if (!name || !actifTypeId) {
      res.status(400).json({ message: "Name and actifTypeId are required" });
      return;
    }

    // Check if actifType exists
    const actifType = await prisma.actifType.findUnique({
      where: { actifTypeId },
    });

    if (!actifType) {
      res.status(404).json({ message: "ActifType not found" });
      return;
    }

    // Check for duplicates
    const existingMarque = await prisma.marque.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        actifTypeId,
      },
    });

    if (existingMarque) {
      res.status(409).json({
        message: "A marque with this name already exists for this actifType",
      });
      return;
    }

    // Create marque
    const marque = await prisma.marque.create({
      data: {
        marqueId: `MAR-${uuidv4().substring(0, 8)}`,
        name,
        actifTypeId,
      },
      include: {
        actifType: true,
      },
    });

    res.status(201).json(marque);
  } catch (error) {
    console.error("Error creating marque:", error);
    res.status(500).json({ message: "Failed to create marque" });
  }
};

/**
 * Update a marque
 */
export const updateMarque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { marqueId } = req.params;
    const { name, actifTypeId } = req.body;

    // Validate
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    // Check if marque exists
    const marque = await prisma.marque.findUnique({
      where: { marqueId },
    });

    if (!marque) {
      res.status(404).json({ message: "Marque not found" });
      return;
    }

    // If actifTypeId is changing, validate it
    if (actifTypeId && actifTypeId !== marque.actifTypeId) {
      const actifType = await prisma.actifType.findUnique({
        where: { actifTypeId },
      });

      if (!actifType) {
        res.status(404).json({ message: "ActifType not found" });
        return;
      }

      // Check for duplicates in the new actifType
      const existingMarque = await prisma.marque.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          actifTypeId,
          marqueId: { not: marqueId },
        },
      });

      if (existingMarque) {
        res.status(409).json({
          message: "A marque with this name already exists for this actifType",
        });
        return;
      }
    }

    // Update marque
    const updatedMarque = await prisma.marque.update({
      where: { marqueId },
      data: {
        name,
        ...(actifTypeId && { actifTypeId }),
      },
      include: {
        actifType: true,
      },
    });

    res.json(updatedMarque);
  } catch (error) {
    console.error("Error updating marque:", error);
    res.status(500).json({ message: "Failed to update marque" });
  }
};

/**
 * Delete a marque
 */
export const deleteMarque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { marqueId } = req.params;

    // Check if marque exists
    const marque = await prisma.marque.findUnique({
      where: { marqueId },
      include: {
        actifs: true,
      },
    });

    if (!marque) {
      res.status(404).json({ message: "Marque not found" });
      return;
    }

    // Check if marque has associated actifs
    if (marque.actifs.length > 0) {
      res.status(409).json({
        message: "Cannot delete marque with associated actifs",
        count: marque.actifs.length,
      });
      return;
    }

    // Delete associated modeles first
    await prisma.modele.deleteMany({
      where: { marqueId },
    });

    // Delete the marque
    await prisma.marque.delete({
      where: { marqueId },
    });

    res.status(200).json({
      message: "Marque deleted successfully",
      id: marqueId,
    });
  } catch (error) {
    console.error("Erreur dans le supprission du marque:", error);
    res.status(500).json({ message: "Echec de suprimer le marque" });
  }
};
