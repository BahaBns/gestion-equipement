// controllers/acceptanceController.ts - FIXED VERSION
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  verifyAssignmentToken,
  updateTokenStatus,
  isTokenUsed,
} from "../services/tokenService";
import {
  sendAcceptanceConfirmation,
  sendAssignmentNotification,
} from "../services/emailServices";
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
function getPrismaClient(database?: "lagom" | "insight" | string) {
  console.log(
    `Getting Prisma client for database: ${database || "insight (default)"}`
  );
  return database === "lagom" ? lagomPrisma : insightPrisma;
}

/**
 * Validate an assignment token and return information about the assignment
 */
export const validateAssignmentToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Debug logging
    console.log("Request headers:", req.headers);
    console.log("Token to validate:", req.params.token);

    const { token } = req.params;

    // Verify the token and extract database info
    const decoded = verifyAssignmentToken(token);
    if (!decoded) {
      console.log("Token verification failed - invalid JWT format");
      res
        .status(400)
        .json({ valid: false, message: "Token invalide ou expiré" });
      return;
    }

    console.log("Decoded token:", decoded);

    // Extract database from token if available, default to insight
    const selectedDatabase = (decoded.database as "lagom" | "insight") || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client based on the database in the token
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used - PASS THE DATABASE PARAMETER
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("Token already used");
      res
        .status(400)
        .json({ valid: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Validate actifIds exist and create a safe reference
    if (!decoded.actifIds || decoded.actifIds.length === 0) {
      console.log("No actifIds found in token");
      res.status(400).json({
        valid: false,
        message: "Aucun équipement trouvé dans le token",
      });
      return;
    }

    // Create a safe reference for TypeScript
    const actifIds = decoded.actifIds;

    // Get employee information
    const employee = await prisma.employee.findUnique({
      where: { employeeId: decoded.employeeId },
    });

    if (!employee) {
      console.log(`Employee not found: ${decoded.employeeId}`);
      res.status(404).json({ valid: false, message: "Employé non trouvé" });
      return;
    }

    // Get actifs information
    const actifs = await prisma.actif.findMany({
      where: { actifId: { in: actifIds } },
      include: {
        status: true,
        actiftype: true,
        marque: true,
        modele: true,
      },
    });

    console.log(`Found ${actifs.length} actifs for token`);

    if (actifs.length === 0) {
      console.log("No actifs found for token");
      res.status(404).json({
        valid: false,
        message: "Aucun équipement trouvé pour ce token",
      });
      return;
    }

    // UPDATED: Check assignment-level status instead of global actif status
    const reservedStatus = await prisma.status.findFirst({
      where: { name: "Réservé" },
    });

    if (!reservedStatus) {
      console.error('Status "Réservé" not found in database');
      res.status(500).json({
        valid: false,
        message: 'Statut "Réservé" non trouvé dans le système',
      });
      return;
    }

    console.log(`Reserved status ID: ${reservedStatus.statusId}`);

    // UPDATED: Check assignment-level status in EmployeeActif table
    const assignments = await prisma.employeeActif.findMany({
      where: {
        employeeId: decoded.employeeId,
        actifId: { in: actifIds },
      },
      include: {
        actif: {
          include: {
            actiftype: true,
            marque: true,
            modele: true,
          },
        },
        status: true, // Assignment-level status
      },
    });

    console.log(`Found ${assignments.length} assignments for employee`);

    if (assignments.length === 0) {
      console.log("No assignments found for employee and actifs");
      res.status(400).json({
        valid: false,
        message: "Aucune assignation trouvée pour ces équipements",
      });
      return;
    }

    if (assignments.length !== actifIds.length) {
      console.log(
        `Expected ${actifIds.length} assignments but found ${assignments.length}`
      );
      res.status(400).json({
        valid: false,
        message: "Certains équipements ne sont plus assignés à cet employé",
      });
      return;
    }

    // UPDATED: Check if assignments are in "Réservé" status (assignment-level)
    const nonReservedAssignments = assignments.filter(
      (assignment) => assignment.statusId !== reservedStatus.statusId
    );

    if (nonReservedAssignments.length > 0) {
      console.log(
        "Some assignments are no longer reserved:",
        nonReservedAssignments.map((a) => a.actifId)
      );
      res.status(400).json({
        valid: false,
        message: "Certains équipements ne sont plus réservés pour vous",
        nonReservedActifs: nonReservedAssignments.map((a) => ({
          actifId: a.actifId,
          marque: a.actif.marque?.name || "Unknown",
          modele: a.actif.modele?.name || "Unknown",
          currentStatus: a.status?.name || "Unknown",
        })),
      });
      return;
    }

    // Transform actifs for response, including quantities from assignments
    const actifDetails = assignments.map((assignment) => {
      const actif = assignment.actif;
      const quantity = decoded.quantities?.[actif.actifId] || assignment.quantity;
      
      return {
        actifId: actif.actifId,
        marque: actif.marque?.name || "Unknown",
        modele: actif.modele?.name || "Unknown",
        serialNumber: actif.serialNumber,
        type: actif.actiftype?.nom || actif.actifType,
        quantity,
        assignmentStatus: assignment.status?.name || "Réservé",
      };
    });

    console.log("Token validation successful");

    // Return success response with assignment details
    res.status(200).json({
      valid: true,
      employee: {
        employeeId: employee.employeeId,
        nom: employee.nom,
        email: employee.email,
      },
      actifs: actifDetails,
    });
  } catch (error) {
    console.error("Error validating assignment token:", error);
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({
      valid: false,
      message: "Une erreur est survenue lors de la validation du token",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Resend assignment invitation email
 */
export const resendAssignmentInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { employeeId, actifId, database } = req.body;
    const selectedDatabase = (database || (req as any).user?.selectedDatabase || "insight") as "lagom" | "insight";

    const prisma = getPrismaClient(selectedDatabase);

    if (!employeeId || !actifId) {
      res.status(400).json({
        success: false,
        message: "Employee ID and actif ID are required",
      });
      return;
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    // UPDATED: Check assignment-level status instead of global actif status
    const assignment = await prisma.employeeActif.findUnique({
      where: {
        employeeId_actifId: {
          employeeId,
          actifId,
        },
      },
      include: {
        actif: true,
        status: true,
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    // Verify assignment is in "Réservé" status
    if (assignment.status?.name !== "Réservé") {
      res.status(400).json({
        success: false,
        message:
          "Cannot resend invitation for assignment that is not in 'Réservé' status",
        currentStatus: assignment.status?.name || "Unknown",
      });
      return;
    }

    // Find the existing assignment token for this actif and employee
    const existingToken = await prisma.assignmentToken.findFirst({
      where: {
        employeeId,
        actifIds: {
          has: actifId,
        },
        status: "PENDING",
      },
    });

    if (!existingToken) {
      res.status(404).json({
        success: false,
        message: "No pending assignment found for this actif and employee",
      });
      return;
    }

    // Send a new email with the token
    const emailSent = await sendAssignmentNotification(
      employee,
      [assignment.actif],
      existingToken.token,
      selectedDatabase
    );

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: "Failed to send email notification",
        emailSent: false,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Assignment invitation resent successfully",
      emailSent: true,
    });
  } catch (error) {
    console.error("Error resending assignment invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend assignment invitation",
      emailSent: false,
    });
  }
};

/**
 * Accept an assignment after employee confirmation
 */
export const acceptAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Add debug logging
    console.log("Accept assignment request:", req.params, req.body);

    const { token } = req.params;
    const { acceptTerms } = req.body;

    // Verify acceptance of terms
    if (!acceptTerms) {
      res.status(400).json({
        success: false,
        message:
          "Vous devez accepter les conditions générales pour confirmer l'assignation",
      });
      return;
    }

    // Verify the token and extract database info
    const decoded = verifyAssignmentToken(token);
    if (!decoded) {
      console.log("Token verification failed in acceptAssignment");
      res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré" });
      return;
    }

    // Extract database from token if available, default to insight
    const selectedDatabase = (decoded.database as "lagom" | "insight") || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client based on the database in the token
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("Token already used in acceptAssignment");
      res
        .status(400)
        .json({ success: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Validate actifIds exist and create a safe reference
    if (!decoded.actifIds || decoded.actifIds.length === 0) {
      console.log("No actifIds found in token");
      res.status(400).json({
        success: false,
        message: "Aucun équipement trouvé dans le token",
      });
      return;
    }

    // Create a safe reference for TypeScript
    const actifIds = decoded.actifIds;

    // Get employee and actifs
    const employee = await prisma.employee.findUnique({
      where: { employeeId: decoded.employeeId },
    });

    if (!employee) {
      res.status(404).json({ success: false, message: "Employé non trouvé" });
      return;
    }

    // Find the "Assigné" status to update assignments
    const assignedStatus = await prisma.status.findFirst({
      where: { name: "Assigné" },
    });

    if (!assignedStatus) {
      res.status(500).json({
        success: false,
        message: 'Statut "Assigné" non trouvé dans le système',
      });
      return;
    }

    // Execute all operations in a transaction
    await prisma.$transaction(async (prismaClient) => {
      // UPDATED: Update assignment-level status instead of global actif status
      for (const actifId of actifIds) {
        await prismaClient.employeeActif.updateMany({
          where: {
            employeeId: decoded.employeeId,
            actifId: actifId,
          },
          data: { 
            statusId: assignedStatus.statusId 
          },
        });
      }

      // Get the updated actifs to include in the confirmation email
      const actifs = await prismaClient.actif.findMany({
        where: { actifId: { in: actifIds } },
      });

      // Mark the token as accepted - PASS THE DATABASE PARAMETER
      await updateTokenStatus(token, "ACCEPTED", selectedDatabase);

      // Send acceptance confirmation email
      await sendAcceptanceConfirmation(employee, actifs, selectedDatabase);
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Assignation acceptée avec succès",
      employeeId: decoded.employeeId,
      actifIds: actifIds,
    });
  } catch (error) {
    console.error("Error accepting assignment:", error);
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'acceptation de l'assignation",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Reject an assignment
 */
export const rejectAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Add debug logging
    console.log("Reject assignment request:", req.params, req.body);

    const { token } = req.params;
    const { reason } = req.body;

    // Verify the token and extract database info
    const decoded = verifyAssignmentToken(token);
    if (!decoded) {
      console.log("Token verification failed in rejectAssignment");
      res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré" });
      return;
    }

    // Extract database from token if available, default to insight
    const selectedDatabase = (decoded.database as "lagom" | "insight") || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client based on the database in the token
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("Token already used in rejectAssignment");
      res
        .status(400)
        .json({ success: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Validate actifIds exist
    if (!decoded.actifIds || decoded.actifIds.length === 0) {
      console.log("No actifIds found in token");
      res.status(400).json({
        success: false,
        message: "Aucun équipement trouvé dans le token",
      });
      return;
    }
    const actifIds = decoded.actifIds;
    // Execute all operations in a transaction
    await prisma.$transaction(async (prismaClient) => {
      // UPDATED: Remove the assignments instead of updating global actif status
      
      for (const actifId of actifIds) {
        // Remove the employee-actif relationship (this automatically handles the assignment-level status)
        await prismaClient.employeeActif.deleteMany({
          where: {
            employeeId: decoded.employeeId,
            actifId,
          },
        });
      }

      // Mark the token as rejected - PASS THE DATABASE PARAMETER
      await updateTokenStatus(token, "REJECTED", selectedDatabase);

      // Log the rejection reason
      console.log(
        `Assignment rejected by employee ${decoded.employeeId}. Reason: ${
          reason || "Not provided"
        }`
      );
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Assignation refusée avec succès",
      employeeId: decoded.employeeId,
       actifIds: decoded.actifIds || [],
    });
  } catch (error) {
    console.error("Error rejecting assignment:", error);
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du refus de l'assignation",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
