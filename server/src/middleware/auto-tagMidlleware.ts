// auto-tag-middleware.ts
import { autoTagActif, autoTagLicense } from "./hashtag-seeder";
import { PrismaClient} from "@prisma/client";


/**
 * Prisma middleware to automatically tag new actifs and licenses
 * Add this to your Prisma client initialization
 */
export function setupAutoTagMiddleware(prisma: PrismaClient) {
  // Add middleware for auto-tagging
  prisma.$use(async (params, next) => {
    // Execute the original operation
    const result = await next(params);

    // Check if this is a create operation on Actif or License
    if (params.action === "create") {
      if (params.model === "Actif" && result.actifId) {
        // Auto-tag the new actif
        autoTagActif(result.actifId).catch((error: any) => {
          console.error(`Auto-tag error for actif ${result.actifId}:`, error);
        });
      } else if (params.model === "License" && result.licenseId) {
        // Auto-tag the new license
        autoTagLicense(result.licenseId).catch((error: any) => {
          console.error(
            `Auto-tag error for license ${result.licenseId}:`,
            error
          );
        });
      }
    }

    // Also check for updates that might require retagging
    if (params.action === "update") {
      // For fields that would affect tagging (status, type, etc.)
      const relevantActifFields = ["actifTypeId", "statusId", "marque"];
      const relevantLicenseFields = [
        "licenseTypeId",
        "statusId",
        "softwareName",
        "vendorName",
        "expiryDate",
      ];

      if (
        params.model === "Actif" &&
        params.args.data &&
        Object.keys(params.args.data).some((key) =>
          relevantActifFields.includes(key)
        )
      ) {
        autoTagActif(result.actifId).catch((error: any) => {
          console.error(
            `Auto-tag error for updated actif ${result.actifId}:`,
            error
          );
        });
      } else if (
        params.model === "License" &&
        params.args.data &&
        Object.keys(params.args.data).some((key) =>
          relevantLicenseFields.includes(key)
        )
      ) {
        autoTagLicense(result.licenseId).catch((error: any) => {
          console.error(
            `Auto-tag error for updated license ${result.licenseId}:`,
            error
          );
        });
      }
    }

    return result;
  });

  return prisma;
}

// Example of how to use this in your Prisma client setup:
/*
import { PrismaClient } from '@prisma/client';
import { setupAutoTagMiddleware } from './auto-tag-middleware';

// Create Prisma client
const prismaWithoutMiddleware = new PrismaClient();

// Setup the client with auto-tag middleware
const prisma = setupAutoTagMiddleware(prismaWithoutMiddleware);

export default prisma;
*/
