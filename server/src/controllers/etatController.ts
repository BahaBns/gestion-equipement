import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const lagomPrisma = new PrismaClient({
  datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new PrismaClient({
  datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});
// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

/**
 * Generate the next etat ID
 */
const generateNextEtatId = async (req: Request): Promise<string> => {
  const prisma = getPrismaClient(req);
  // Fetch the last etat from the database
  const lastEtat = await prisma.etat.findFirst({
    orderBy: {
      etatId: "desc",
    },
  });

  if (!lastEtat) {
    // If no etats exist, start with "ETT-1"
    return "ETT-1";
  }

  // Extract the numeric part of the ID
  const lastIdNumber = parseInt(lastEtat.etatId.split("-")[1], 10);

  // Increment the numeric part and return the new ID
  return `ETT-${lastIdNumber + 1}`;
};

/**
 * Get all etats
 */
export const getAllEtats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    // Include count of associated actifs and licenses
    const etats = await prisma.etat.findMany({
      include: {
        _count: {
          select: {
            actifs: true,
            licenses: true,
          },
        },
      },
    });
    res.json(etats);
  } catch (error) {
    console.error("Error retrieving etats:", error);
    res.status(500).json({
      message: "Failed to retrieve etats",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get actifs by etat
 */
export const getActifsByEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { etatId } = req.params;

    // Verify the etat exists
    const etat = await prisma.etat.findUnique({
      where: { etatId },
    });

    if (!etat) {
      res.status(404).json({ message: "Etat not found" });
      return;
    }

    // Get all actifs with the specified etat
    const actifs = await prisma.actif.findMany({
      where: { etatId },
      include: {
        actiftype: true,
        etat: true,
        employees: {
          include: {
            employee: true,
          },
        },
        specification: true,
        attachments: true,
      },
    });

    // Transform the data to make it easier to work with in the frontend
    const transformedActifs = actifs.map((actif) => ({
      ...actif,
      employees: actif.employees.map((ea) => ({
        ...ea.employee,
        quantity: ea.quantity,
        assignedAt: ea.assignedAt,
      })),
    }));

    res.json(transformedActifs);
  } catch (error) {
    console.error("Error retrieving actifs by etat:", error);
    res.status(500).json({
      message: "Failed to retrieve actifs by etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get licenses by etat
 */
export const getLicensesByEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { etatId } = req.params;

    // Verify the etat exists
    const etat = await prisma.etat.findUnique({
      where: { etatId },
    });

    if (!etat) {
      res.status(404).json({ message: "Etat not found" });
      return;
    }

    // Get all licenses with the specified etat
    const licenses = await prisma.license.findMany({
      where: { etatId },
      include: {
        licensetype: true,
        etat: true,
        employees: {
          include: {
            employee: true,
          },
        },
        attachments: true,
      },
    });

    // Transform the data to make it easier to work with in the frontend
    const transformedLicenses = licenses.map((license) => ({
      ...license,
      employees: license.employees.map((el) => ({
        ...el.employee,
        quantity: el.quantity,
        assignedAt: el.assignedAt,
      })),
    }));

    res.json(transformedLicenses);
  } catch (error) {
    console.error("Error retrieving licenses by etat:", error);
    res.status(500).json({
      message: "Failed to retrieve licenses by etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update actif etat
 */
export const updateActifEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { actifId } = req.params;
    const { etatId } = req.body;

    if (!etatId) {
      res.status(400).json({ message: "Etat ID is required" });
      return;
    }

    // Verify the actif exists
    const actif = await prisma.actif.findUnique({
      where: { actifId },
    });

    if (!actif) {
      res.status(404).json({ message: "Actif not found" });
      return;
    }

    // Verify the etat exists
    const etat = await prisma.etat.findUnique({
      where: { etatId },
    });

    if (!etat) {
      res.status(404).json({ message: "Etat not found" });
      return;
    }

    // Update the actif etat
    const updatedActif = await prisma.actif.update({
      where: { actifId },
      data: {
        etatId,
      },
      include: {
        etat: true,
        actiftype: true,
      },
    });

    res.status(200).json(updatedActif);
  } catch (error) {
    console.error("Error updating actif etat:", error);
    res.status(500).json({
      message: "Failed to update actif etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update license etat
 */
export const updateLicenseEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { licenseId } = req.params;
    const { etatId } = req.body;

    if (!etatId) {
      res.status(400).json({ message: "Etat ID is required" });
      return;
    }

    // Verify the license exists
    const license = await prisma.license.findUnique({
      where: { licenseId },
    });

    if (!license) {
      res.status(404).json({ message: "License not found" });
      return;
    }

    // Verify the etat exists
    const etat = await prisma.etat.findUnique({
      where: { etatId },
    });

    if (!etat) {
      res.status(404).json({ message: "Etat not found" });
      return;
    }

    // Update the license etat
    const updatedLicense = await prisma.license.update({
      where: { licenseId },
      data: {
        etatId,
      },
      include: {
        etat: true,
        licensetype: true,
      },
    });

    res.status(200).json(updatedLicense);
  } catch (error) {
    console.error("Error updating license etat:", error);
    res.status(500).json({
      message: "Failed to update license etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new etat
 */
export const createEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Etat name is required" });
      return;
    }

    // Check if etat with the same name already exists
    const existingEtat = await prisma.etat.findUnique({
      where: { name },
    });

    if (existingEtat) {
      res.status(409).json({ message: "Etat with this name already exists" });
      return;
    }

    // Generate the next etat ID
    const etatId = await generateNextEtatId(req);

    // Create the new etat
    const newEtat = await prisma.etat.create({
      data: {
        etatId,
        name,
      },
    });

    res.status(201).json(newEtat);
  } catch (error) {
    console.error("Error creating etat:", error);
    res.status(500).json({
      message: "Failed to create etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete an etat
 */
export const deleteEtat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    const { etatId } = req.params;

    // Check if the etat exists with associated actifs and licenses
    const etat = await prisma.etat.findUnique({
      where: { etatId },
      include: {
        actifs: true,
        licenses: true,
      },
    });

    if (!etat) {
      res.status(404).json({ message: "Etat not found" });
      return;
    }

    // Prevent deletion if etat has associated actifs or licenses
    if (etat.actifs.length > 0 || etat.licenses.length > 0) {
      res.status(400).json({
        message:
          "Cannot delete etat because it has associated actifs or licenses. Please reassign them first.",
      });
      return;
    }

    // Delete the etat
    await prisma.etat.delete({
      where: { etatId },
    });

    res.status(200).json({ message: "Etat deleted successfully" });
  } catch (error) {
    console.error("Error deleting etat:", error);
    res.status(500).json({
      message: "Failed to delete etat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get etat usage statistics
 */
export const getEtatUsageStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
        const prisma = getPrismaClient(req);

    // Get all etats with counts of associated actifs and licenses
    const etats = await prisma.etat.findMany();

    const etatStats = await Promise.all(
      etats.map(async (etat) => {
        // Count actifs with this etat
        const actifCount = await prisma.actif.count({
          where: { etatId: etat.etatId },
        });

        // Count licenses with this etat
        const licenseCount = await prisma.license.count({
          where: { etatId: etat.etatId },
        });

        return {
          etatId: etat.etatId,
          name: etat.name,
          totalActifs: actifCount,
          totalLicenses: licenseCount,
          totalItems: actifCount + licenseCount,
        };
      })
    );

    res.json(etatStats);
  } catch (error) {
    console.error("Error retrieving etat usage statistics:", error);
    res.status(500).json({
      message: "Failed to retrieve etat usage statistics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
