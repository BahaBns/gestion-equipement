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
 * Get all fournisseurs
 */
export const getFournisseurs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const search = req.query.search?.toString();

    const fournisseurs = await prisma.fournisseur.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      include: {
        _count: {
          select: { actifs: true },
        },
      },
    });

    res.json(fournisseurs);
  } catch (error) {
    console.error("Error retrieving fournisseurs:", error);
    res.status(500).json({ message: "Failed to retrieve fournisseurs" });
  }
};

/**
 * Get fournisseur by ID
 */
export const getFournisseurById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { fournisseurId } = req.params;

    const fournisseur = await prisma.fournisseur.findUnique({
      where: { fournisseurId },
      include: {
        actifs: {
          take: 10, // Limit to 10 actifs
        },
        _count: {
          select: { actifs: true },
        },
      },
    });

    if (!fournisseur) {
      res.status(404).json({ message: "Fournisseur not found" });
      return;
    }

    res.json(fournisseur);
  } catch (error) {
    console.error("Error retrieving fournisseur:", error);
    res.status(500).json({ message: "Failed to retrieve fournisseur" });
  }
};

/**
 * Create a new fournisseur
 */
export const createFournisseur = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    // Check for duplicates
    const existingFournisseur = await prisma.fournisseur.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existingFournisseur) {
      res
        .status(409)
        .json({ message: "A fournisseur with this name already exists" });
      return;
    }

    // Create fournisseur with the new fields
    const fournisseurId = `FOUR-${uuidv4().substring(0, 8)}`;

    const fournisseur = await prisma.fournisseur.create({
      data: {
        fournisseurId,
        name,
        email,
        phone,
      },
    });

    res.status(201).json(fournisseur);
  } catch (error) {
    console.error("Error creating fournisseur:", error);
    res.status(500).json({ message: "Failed to create fournisseur" });
  }
};

/**
 * Update a fournisseur
 */
export const updateFournisseur = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { fournisseurId } = req.params;
    const { name, email, phone } = req.body;

    // Validate
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    // Check if fournisseur exists
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { fournisseurId },
    });

    if (!fournisseur) {
      res.status(404).json({ message: "Fournisseur not found" });
      return;
    }

    // Check for duplicates
    if (name !== fournisseur.name) {
      const existingFournisseur = await prisma.fournisseur.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          fournisseurId: { not: fournisseurId },
        },
      });

      if (existingFournisseur) {
        res.status(409).json({
          message: "Another fournisseur with this name already exists",
        });
        return;
      }
    }

    // Update fournisseur
    const updatedFournisseur = await prisma.fournisseur.update({
      where: { fournisseurId },
      data: {
        name,
        email,
        phone,
      },
    });

    res.json(updatedFournisseur);
  } catch (error) {
    console.error("Error updating fournisseur:", error);
    res.status(500).json({ message: "Failed to update fournisseur" });
  }
};

/**
 * Delete a fournisseur
 */
export const deleteFournisseur = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { fournisseurId } = req.params;

    // Check if fournisseur exists
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { fournisseurId },
      include: {
        actifs: true,
      },
    });

    if (!fournisseur) {
      res.status(404).json({ message: "Fournisseur not found" });
      return;
    }

    // Check if fournisseur has associated actifs
    if (fournisseur.actifs.length > 0) {
      res.status(409).json({
        message: "Cannot delete fournisseur with associated actifs",
        count: fournisseur.actifs.length,
      });
      return;
    }

    // Delete the fournisseur
    await prisma.fournisseur.delete({
      where: { fournisseurId },
    });

    res.status(200).json({
      message: "Fournisseur deleted successfully",
      id: fournisseurId,
    });
  } catch (error) {
    console.error("Error deleting fournisseur:", error);
    res.status(500).json({ message: "Failed to delete fournisseur" });
  }
};
