"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoTagMiddleware = setupAutoTagMiddleware;
// auto-tag-middleware.ts
const hashtag_seeder_1 = require("./hashtag-seeder");
/**
 * Prisma middleware to automatically tag new actifs and licenses
 * Add this to your Prisma client initialization
 */
function setupAutoTagMiddleware(prisma) {
    // Add middleware for auto-tagging
    prisma.$use((params, next) => __awaiter(this, void 0, void 0, function* () {
        // Execute the original operation
        const result = yield next(params);
        // Check if this is a create operation on Actif or License
        if (params.action === "create") {
            if (params.model === "Actif" && result.actifId) {
                // Auto-tag the new actif
                (0, hashtag_seeder_1.autoTagActif)(result.actifId).catch((error) => {
                    console.error(`Auto-tag error for actif ${result.actifId}:`, error);
                });
            }
            else if (params.model === "License" && result.licenseId) {
                // Auto-tag the new license
                (0, hashtag_seeder_1.autoTagLicense)(result.licenseId).catch((error) => {
                    console.error(`Auto-tag error for license ${result.licenseId}:`, error);
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
            if (params.model === "Actif" &&
                params.args.data &&
                Object.keys(params.args.data).some((key) => relevantActifFields.includes(key))) {
                (0, hashtag_seeder_1.autoTagActif)(result.actifId).catch((error) => {
                    console.error(`Auto-tag error for updated actif ${result.actifId}:`, error);
                });
            }
            else if (params.model === "License" &&
                params.args.data &&
                Object.keys(params.args.data).some((key) => relevantLicenseFields.includes(key))) {
                (0, hashtag_seeder_1.autoTagLicense)(result.licenseId).catch((error) => {
                    console.error(`Auto-tag error for updated license ${result.licenseId}:`, error);
                });
            }
        }
        return result;
    }));
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
