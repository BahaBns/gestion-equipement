// services/taskScheduler.ts
import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { updateTokenStatus } from "./tokenService";

const prisma = new PrismaClient();

/**
 * Process expired assignment tokens and return equipment/licenses to available status
 */
const processExpiredAssignments = async (): Promise<void> => {
  try {
    console.log("Checking for expired assignment tokens...");

    // Find expired tokens that are still pending
    const expiredTokens = await prisma.assignmentToken.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredTokens.length === 0) {
      console.log("No expired tokens found");
      return;
    }

    console.log(
      `Found ${expiredTokens.length} expired assignment tokens to process`
    );

    // Find "Disponible" status for resetting items
    const availableStatus = await prisma.status.findFirst({
      where: { name: "Disponible" },
    });

    if (!availableStatus) {
      console.error('Status "Disponible" not found in the system');
      return;
    }

    // Process each expired token
    for (const tokenRecord of expiredTokens) {
      await prisma.$transaction(async (prismaClient) => {
        // Handle based on token type
        if (tokenRecord.type === "actif") {
          // Update actif status back to available
          for (const actifId of tokenRecord.actifIds) {
            await prismaClient.actif.update({
              where: { actifId },
              data: { statusId: availableStatus.statusId },
            });

            // Remove employee-actif relationship
            await prismaClient.employeeActif.deleteMany({
              where: {
                employeeId: tokenRecord.employeeId,
                actifId,
              },
            });

            // Log the expiration
            await prismaClient.activityLog.create({
              data: {
                activityType: "ACTIF_REJECTED",
                employeeId: tokenRecord.employeeId,
                actifId,
                details: "Réservation expirée automatiquement après 7 jours",
                timestamp: new Date(),
              },
            });
          }
        } else if (tokenRecord.type === "license") {
          // Update license status back to available
          for (const licenseId of tokenRecord.licenseIds) {
            await prismaClient.license.update({
              where: { licenseId },
              data: { statusId: availableStatus.statusId },
            });

            // Remove employee-license relationship
            await prismaClient.employeeLicense.deleteMany({
              where: {
                employeeId: tokenRecord.employeeId,
                licenseId,
              },
            });

            // Log the expiration
            await prismaClient.activityLog.create({
              data: {
                activityType: "LICENSE_REJECTED",
                employeeId: tokenRecord.employeeId,
                licenseId,
                details: "Réservation expirée automatiquement après 7 jours",
                timestamp: new Date(),
              },
            });
          }
        }

        // Mark token as expired
        await updateTokenStatus(tokenRecord.token, "EXPIRED");
      });

      console.log(
        `Processed expired token ${tokenRecord.tokenId} for employee ${tokenRecord.employeeId}`
      );
    }

    console.log("Finished processing expired assignment tokens");
  } catch (error) {
    console.error("Error processing expired assignments:", error);
  }
};

/**
 * Initialize the task scheduler
 */
export const initializeTaskScheduler = (): void => {
  // Run every day at midnight
  const dailyJob = new CronJob("0 0 * * *", processExpiredAssignments);

  // Start the job
  dailyJob.start();
  console.log("Task scheduler initialized for processing expired assignments");
};
