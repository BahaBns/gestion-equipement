import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
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
 * Get all modeles
 */

export const getModeles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const search = req.query.search?.toString();

    const modeles = await prisma.modele.findMany({
      where: {
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              nomTechnique: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      include: {
        marque: true,
        _count: {
          select: { actifs: true },
        },
      },
    });

    res.json(modeles);
  } catch (error) {
    console.error("Error retrieving modeles:", error);
    res.status(500).json({ message: "Failed to retrieve modeles" });
  }
};

/**
 * Get all modeles by marque
 */
export const getModelesByMarque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { marqueId } = req.params;
    const search = req.query.search?.toString();

    // Verify marque exists
    const marque = await prisma.marque.findUnique({
      where: { marqueId },
    });

    if (!marque) {
      res.status(404).json({ message: "Marque not found" });
      return;
    }

    const modeles = await prisma.modele.findMany({
      where: {
        marqueId,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              nomTechnique: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      include: {
        marque: true,
        _count: {
          select: { actifs: true },
        },
      },
    });

    res.json(modeles);
  } catch (error) {
    console.error("Error retrieving modeles:", error);
    res.status(500).json({ message: "Failed to retrieve modeles" });
  }
};

/**
 * Create a new modele
 */
export const createModele = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { marqueId } = req.params;
    const { name, nomTechnique } = req.body;

    // Validate required fields
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

    // Check for duplicates
    const existingModele = await prisma.modele.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        marqueId,
      },
    });

    if (existingModele) {
      res.status(409).json({
        message: "A modele with this name already exists for this marque",
      });
      return;
    }

    // Create modele
    const modele = await prisma.modele.create({
      data: {
        modeleId: `MOD-${uuidv4().substring(0, 8)}`,
        name,
        nomTechnique: nomTechnique || null,
        marqueId,
      },
      include: {
        marque: true,
      },
    });

    res.status(201).json(modele);
  } catch (error) {
    console.error("Error creating modele:", error);
    res.status(500).json({ message: "Failed to create modele" });
  }
};

/**
 * Update a modele
 */
export const updateModele = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { modeleId } = req.params;
    const { name, nomTechnique, marqueId } = req.body;

    // Validate
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    // Check if modele exists
    const modele = await prisma.modele.findUnique({
      where: { modeleId },
    });

    if (!modele) {
      res.status(404).json({ message: "Modele not found" });
      return;
    }

    // If marqueId is changing, validate it
    if (marqueId && marqueId !== modele.marqueId) {
      const marque = await prisma.marque.findUnique({
        where: { marqueId },
      });

      if (!marque) {
        res.status(404).json({ message: "Marque not found" });
        return;
      }

      // Check for duplicates in the new marque
      const existingModele = await prisma.modele.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          marqueId,
          modeleId: { not: modeleId },
        },
      });

      if (existingModele) {
        res.status(409).json({
          message: "A modele with this name already exists for this marque",
        });
        return;
      }
    } else {
      // Check for duplicates in the same marque
      const existingModele = await prisma.modele.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          marqueId: modele.marqueId,
          modeleId: { not: modeleId },
        },
      });

      if (existingModele) {
        res.status(409).json({
          message: "A modele with this name already exists for this marque",
        });
        return;
      }
    }

    // Update modele
    const updatedModele = await prisma.modele.update({
      where: { modeleId },
      data: {
        name,
        nomTechnique: nomTechnique !== undefined ? nomTechnique : undefined,
        ...(marqueId && { marqueId }),
      },
      include: {
        marque: true,
      },
    });

    res.json(updatedModele);
  } catch (error) {
    console.error("Error updating modele:", error);
    res.status(500).json({ message: "Failed to update modele" });
  }
};

/**
 * Delete a modele
 */
export const deleteModele = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { modeleId } = req.params;

    // Check if modele exists
    const modele = await prisma.modele.findUnique({
      where: { modeleId },
      include: {
        actifs: true,
      },
    });

    if (!modele) {
      res.status(404).json({ message: "Modele not found" });
      return;
    }

    // Check if modele has associated actifs
    if (modele.actifs.length > 0) {
      res.status(409).json({
        message: "Cannot delete modele with associated actifs",
        count: modele.actifs.length,
      });
      return;
    }

    // Delete the modele
    await prisma.modele.delete({
      where: { modeleId },
    });

    res.status(200).json({
      message: "Modele deleted successfully",
      id: modeleId,
    });
  } catch (error) {
    console.error("Error deleting modele:", error);
    res.status(500).json({ message: "Failed to delete modele" });
  }
};