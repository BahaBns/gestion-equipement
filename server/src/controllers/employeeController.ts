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
 * Generate Employee ID
 * Format: EM00<number>
 */
const generateEmployeeId = async (req: Request): Promise<string> => {
  const prisma = getPrismaClient(req);
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: {
      employeeId: "desc", // Get the last employee by ID
    },
  });

  const lastNumber = lastEmployee
    ? parseInt(lastEmployee.employeeId.replace("EM00", ""), 10)
    : 0; // Extract the numeric part or start from 0

  const nextNumber = lastNumber + 1;
  return `EM00${nextNumber.toString().padStart(4, "0")}`; // Ensure 4-digit padding
};

/**
 * This is a modified version of the getEmployees function to better handle license data
 * Add this to your employee controller
 */
export const getEmployees = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const employees = await prisma.employee.findMany({
      include: {
        actifs: {
          include: {
            actif: true,
          },
        },
        licenses: {
          include: {
            license: {
              include: {
                status: true,
                licensetype: true,
              },
            },
          },
        },
      },
    });

    // Transform the data structure to make it easier to work with in the frontend
    const transformedEmployees = employees.map((employee) => {
      return {
        ...employee,
        actifs: employee.actifs.map((ea) => ({
          ...ea.actif,
          quantity: ea.quantity,
          assignedAt: ea.assignedAt,
        })),
        licenses: employee.licenses.map((el) => ({
          ...el.license,
          quantity: el.quantity,
          assignedAt: el.assignedAt,
        })),
      };
    });

    res.json(transformedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees", error: error });
  }
};

/**
 * Create a new employee
 */
export const createEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { nom, email, actifIds } = req.body; // Employee details and optional actif IDs

    // Generate the employee ID
    const employeeId = await generateEmployeeId(req);

    // Use a transaction to handle multiple operations
    const result = await prisma.$transaction(async (prismaClient) => {
      // Create the employee
      const employee = await prismaClient.employee.create({
        data: {
          employeeId,
          nom,
          email,
        },
      });

      // If actifIds are provided, create the relationships
      if (actifIds && Array.isArray(actifIds) && actifIds.length > 0) {
        for (const actifId of actifIds) {
          // Check if actif exists
          const actif = await prismaClient.actif.findUnique({
            where: { actifId },
          });

          if (actif) {
            await prismaClient.employeeActif.create({
              data: {
                employeeId,
                actifId,
                assignedAt: new Date(),
              },
            });
          }
        }
      }

      // Return the created employee with relationships
      return await prismaClient.employee.findUnique({
        where: { employeeId },
        include: {
          actifs: {
            include: {
              actif: true,
            },
          },
        },
      });
    });

    // Return the created employee
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Error creating employee" });
  }
};

/**
 * Delete an employee by employeeId
 */
export const deleteEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);
    const { employeeId } = req.params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    // If employee not found, send a 404 response
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // Use transaction to handle multiple operations
    await prisma.$transaction(async (prismaClient) => {
      // Delete all employeeActif relationships
      await prismaClient.employeeActif.deleteMany({
        where: { employeeId },
      });

      // Delete all employeeLicense relationships
      await prismaClient.employeeLicense.deleteMany({
        where: { employeeId },
      });

      // Delete all assignmentTokens for this employee
      await prismaClient.assignmentToken.deleteMany({
        where: { employeeId },
      });

      // Delete all activity logs for this employee
      await prismaClient.activityLog.deleteMany({
        where: { employeeId },
      });

      // Then delete the employee
      await prismaClient.employee.delete({
        where: { employeeId },
      });
    });

    // Return a success message
    res
      .status(200)
      .json({ message: `Employee with ID ${employeeId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Error deleting employee" });
  }
};

/**
 * Assign actifs to an employee
 */
export const assignActifs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { employeeId } = req.params;
    const { actifIds } = req.body;

    // Validate input
    if (!Array.isArray(actifIds) || actifIds.length === 0) {
      res.status(400).json({ message: "Invalid actifs selection" });
      return;
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // Use transaction to handle multiple operations
    await prisma.$transaction(async (prismaClient) => {
      // For each actifId, create a relationship in EmployeeActif
      for (const actifId of actifIds) {
        // Check if actif exists
        const actif = await prismaClient.actif.findUnique({
          where: { actifId },
        });

        if (actif) {
          // Check if relationship already exists
          const existingRelation = await prismaClient.employeeActif.findUnique({
            where: {
              employeeId_actifId: {
                employeeId,
                actifId,
              },
            },
          });

          // Only create if it doesn't exist
          if (!existingRelation) {
            await prismaClient.employeeActif.create({
              data: {
                employeeId,
                actifId,
                assignedAt: new Date(),
              },
            });
          }
        }
      }
    });

    res
      .status(200)
      .json({ message: "Actifs successfully assigned to employee" });
  } catch (error) {
    console.error("Error assigning actifs:", error);
    res.status(500).json({ message: "Error assigning actifs" });
  }
};

/**
 * Remove actifs from an employee
 */
export const removeActifs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { employeeId } = req.params;
    const { actifIds } = req.body;

    // Validate input
    if (!Array.isArray(actifIds) || actifIds.length === 0) {
      res.status(400).json({ message: "Invalid actifs selection" });
      return;
    }

    // Delete the specified relationships
    await prisma.employeeActif.deleteMany({
      where: {
        employeeId,
        actifId: {
          in: actifIds,
        },
      },
    });

    res
      .status(200)
      .json({ message: "Actifs successfully removed from employee" });
  } catch (error) {
    console.error("Error removing actifs:", error);
    res.status(500).json({ message: "Error removing actifs" });
  }
};
