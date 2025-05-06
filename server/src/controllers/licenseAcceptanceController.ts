// controllers/licenseAcceptanceController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  verifyAssignmentToken,
  updateTokenStatus,
  isTokenUsed,
} from "../services/tokenService";
import {
  sendLicenseAcceptanceConfirmation,
  sendLicenseAssignmentNotification,
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
function getPrismaClient(database?: string) {
  console.log(
    `Getting Prisma client for database: ${database || "insight (default)"}`
  );
  return database === "lagom" ? lagomPrisma : insightPrisma;
}

/**
 * Validate a license assignment token and return information about the assignment
 */
export const validateLicenseToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Validating license token:", req.params.token);

    const { token } = req.params;

    // Verify the token and extract database info
    const decoded = verifyAssignmentToken(token);
    if (!decoded || decoded.type !== "license" || !decoded.licenseIds) {
      console.log(
        "Token verification failed - invalid JWT format or not a license token"
      );
      res
        .status(400)
        .json({ valid: false, message: "Token invalide ou expiré" });
      return;
    }

    console.log("Decoded license token:", decoded);

    // Extract database from token if available, default to insight
    const selectedDatabase = decoded.database || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("License token already used");
      res
        .status(400)
        .json({ valid: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Get employee information
    const employee = await prisma.employee.findUnique({
      where: { employeeId: decoded.employeeId },
    });

    if (!employee) {
      console.log(`Employee not found: ${decoded.employeeId}`);
      res.status(404).json({ valid: false, message: "Employé non trouvé" });
      return;
    }

    // Get licenses information
    const licenses = await prisma.license.findMany({
      where: { licenseId: { in: decoded.licenseIds } },
      include: {
        status: true,
        licensetype: true,
      },
    });

    console.log(`Found ${licenses.length} licenses for token`);

    // Check if all licenses are still reserved for this employee
    const reservedStatus = await prisma.status.findFirst({
      where: { name: "Réservé" },
    });

    if (!reservedStatus) {
      res.status(500).json({
        valid: false,
        message: 'Statut "Réservé" non trouvé dans le système',
      });
      return;
    }

    // Check if any licenses are no longer reserved
    const nonReservedLicenses = licenses.filter(
      (license) => license.statusId !== reservedStatus.statusId
    );

    if (nonReservedLicenses.length > 0) {
      res.status(400).json({
        valid: false,
        message: "Certaines licences ne sont plus réservées pour vous",
        nonReservedLicenses: nonReservedLicenses.map((l) => ({
          licenseId: l.licenseId,
          softwareName: l.softwareName,
          version: l.version,
        })),
      });
      return;
    }

    // Transform licenses for response, including quantities
    const licenseDetails = licenses.map((license) => {
      const quantity = decoded.quantities?.[license.licenseId] || 1;
      return {
        licenseId: license.licenseId,
        softwareName: license.softwareName,
        version: license.version,
        licenseType: license.licenseType,
        licenseKey: license.licenseKey,
        expiryDate: license.expiryDate,
        quantity,
      };
    });

    console.log("License token validation successful");

    // Return success response with assignment details
    res.status(200).json({
      valid: true,
      employee: {
        employeeId: employee.employeeId,
        nom: employee.nom,
        email: employee.email,
      },
      licenses: licenseDetails,
    });
  } catch (error) {
    console.error("Error validating license token:", error);
    res.status(500).json({
      valid: false,
      message: "Une erreur est survenue lors de la validation du token",
    });
  }
};

/**
 * Accept a license assignment after employee confirmation
 */
export const acceptLicenseAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Accept license assignment request:", req.params, req.body);

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
    if (!decoded || decoded.type !== "license" || !decoded.licenseIds) {
      console.log("Token verification failed in acceptLicenseAssignment");
      res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré" });
      return;
    }

    // Extract database from token if available, default to insight
    const selectedDatabase = decoded.database || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("License token already used");
      res
        .status(400)
        .json({ success: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Get employee and licenses
    const employee = await prisma.employee.findUnique({
      where: { employeeId: decoded.employeeId },
    });

    if (!employee) {
      res.status(404).json({ success: false, message: "Employé non trouvé" });
      return;
    }

    // Find the "Assigned" status to update licenses
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
      // Update status of all licenses to "Assigned"
      for (const licenseId of decoded.licenseIds || []) {
        await prismaClient.license.update({
          where: { licenseId },
          data: { statusId: assignedStatus.statusId },
        });

        // Create activity log entry
        await prismaClient.activityLog.create({
          data: {
            activityType: "LICENSE_ACCEPTED",
            employeeId: decoded.employeeId,
            licenseId,
            details: "Licence acceptée par l'employé",
            timestamp: new Date(),
          },
        });
      }

      // Get the updated licenses to include in the confirmation email
      const licenses = await prismaClient.license.findMany({
        where: { licenseId: { in: decoded.licenseIds || [] } },
      });

      // Mark the token as accepted with the correct database
      await updateTokenStatus(token, "ACCEPTED", selectedDatabase);

      // Send acceptance confirmation email
      await sendLicenseAcceptanceConfirmation(employee, licenses);
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Assignation des licences acceptée avec succès",
      employeeId: decoded.employeeId,
      licenseIds: decoded.licenseIds,
    });
  } catch (error) {
    console.error("Error accepting license assignment:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'acceptation de l'assignation",
    });
  }
};

/**
 * Reject a license assignment
 */
export const rejectLicenseAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Reject license assignment request:", req.params, req.body);

    const { token } = req.params;
    const { reason } = req.body;

    // Verify the token and extract database info
    const decoded = verifyAssignmentToken(token);
    if (!decoded || decoded.type !== "license" || !decoded.licenseIds) {
      console.log("Token verification failed in rejectLicenseAssignment");
      res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré" });
      return;
    }

    // Extract database from token if available, default to insight
    const selectedDatabase = decoded.database || "insight";
    console.log(`Using database from token: ${selectedDatabase}`);

    // Get the appropriate Prisma client
    const prisma = getPrismaClient(selectedDatabase);

    // Check if token has already been used
    const used = await isTokenUsed(token, selectedDatabase);
    if (used) {
      console.log("License token already used");
      res
        .status(400)
        .json({ success: false, message: "Ce lien a déjà été utilisé" });
      return;
    }

    // Find the "Disponible" status to return licenses to stock
    const availableStatus = await prisma.status.findFirst({
      where: { name: "Disponible" },
    });

    if (!availableStatus) {
      res.status(500).json({
        success: false,
        message: 'Statut "Disponible" non trouvé dans le système',
      });
      return;
    }

    // Execute all operations in a transaction
    await prisma.$transaction(async (prismaClient) => {
      // Update status of all licenses back to "Disponible"
      for (const licenseId of decoded.licenseIds || []) {
        await prismaClient.license.update({
          where: { licenseId },
          data: { statusId: availableStatus.statusId },
        });

        // Remove the employee-license relationship
        await prismaClient.employeeLicense.deleteMany({
          where: {
            employeeId: decoded.employeeId,
            licenseId,
          },
        });

        // Create activity log entry
        await prismaClient.activityLog.create({
          data: {
            activityType: "LICENSE_REJECTED",
            employeeId: decoded.employeeId,
            licenseId,
            details: `Licence refusée par l'employé. Raison: ${
              reason || "Non spécifiée"
            }`,
            timestamp: new Date(),
          },
        });
      }

      // Mark the token as rejected
      await updateTokenStatus(token, "REJECTED", selectedDatabase);
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Assignation des licences refusée avec succès",
      employeeId: decoded.employeeId,
      licenseIds: decoded.licenseIds,
    });
  } catch (error) {
    console.error("Error rejecting license assignment:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du refus de l'assignation",
    });
  }
};

/**
 * Resend license assignment invitation email
 */
export const resendLicenseInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { employeeId, licenseId, database } = req.body;
    const selectedDatabase =
      database || (req as any).user?.selectedDatabase || "insight";

    const prisma = getPrismaClient(selectedDatabase);

    if (!employeeId || !licenseId) {
      res.status(400).json({
        success: false,
        message: "Employee ID and license ID are required",
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

    // Get license and check if it's in "Réservé" status
    const license = await prisma.license.findUnique({
      where: { licenseId },
      include: {
        status: true,
      },
    });

    if (!license) {
      res.status(404).json({
        success: false,
        message: "License not found",
      });
      return;
    }

    // Verify license is in "Réservé" status
    if (license.status?.name !== "Réservé") {
      res.status(400).json({
        success: false,
        message:
          "Cannot resend invitation for license that is not in 'Réservé' status",
      });
      return;
    }

    // Find the existing assignment token for this license and employee
    const existingToken = await prisma.assignmentToken.findFirst({
      where: {
        employeeId,
        licenseIds: {
          has: licenseId,
        },
        status: "PENDING",
        type: "license",
      },
    });

    if (!existingToken) {
      res.status(404).json({
        success: false,
        message: "No pending assignment found for this license and employee",
      });
      return;
    }

    // Send a new email with the token
    const emailSent = await sendLicenseAssignmentNotification(
      employee,
      [license],
      existingToken.token
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
      message: "License assignment invitation resent successfully",
      emailSent: true,
    });
  } catch (error) {
    console.error("Error resending license assignment invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend license assignment invitation",
      emailSent: false,
    });
  }
};
