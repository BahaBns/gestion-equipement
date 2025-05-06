import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
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
 * Update or create specification for an actif
 */
export const updateSpecification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
            const prisma = getPrismaClient(req);

    const { actifId } = req.params;
    const { ram, cpu, stockage, graphique } = req.body;

    const actif = await prisma.actif.findUnique({
      where: { actifId },
    });

    if (!actif) {
      res.status(404).json({ message: "Actif not found" });
      return;
    }

    // Check if a specification already exists for this actif
    const existingSpec = await prisma.specification.findUnique({
      where: { actifId },
    });

    let specification;
    if (existingSpec) {
      // Update existing specification
      specification = await prisma.specification.update({
        where: { actifId },
        data: {
          ram: ram !== undefined ? ram : existingSpec.ram,
          cpu: cpu !== undefined ? cpu : existingSpec.cpu,
          stockage: stockage !== undefined ? stockage : existingSpec.stockage,
          graphique:
            graphique !== undefined ? graphique : existingSpec.graphique,
        },
      });
    } else {
      // Create new specification
      // Generate a unique specification ID
      const specificationId = `SPEC-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      specification = await prisma.specification.create({
        data: {
          specificationId,
          actifId,
          ram,
          cpu,
          stockage,
          graphique,
        },
      });
    }

    res.status(200).json(specification);
  } catch (error) {
    console.error("Error updating specification:", error);
    res.status(500).json({
      message: "Failed to update specification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all specifications
 */
export const getAllSpecifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                const prisma = getPrismaClient(req);

    const specifications = await prisma.specification.findMany({
      include: {
        actif: true,
      },
    });

    res.json(specifications);
  } catch (error) {
    console.error("Error retrieving specifications:", error);
    res.status(500).json({
      message: "Failed to retrieve specifications",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get specification by actif ID
 */
export const getSpecificationByActifId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
                const prisma = getPrismaClient(req);

    const { actifId } = req.params;

    const specification = await prisma.specification.findUnique({
      where: { actifId },
      include: {
        actif: true,
      },
    });

    if (!specification) {
      res
        .status(404)
        .json({ message: "Specification not found for this actif" });
      return;
    }

    res.json(specification);
  } catch (error) {
    console.error("Error retrieving specification:", error);
    res.status(500).json({
      message: "Failed to retrieve specification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
