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
exports.main = main;
const client_1 = require("@prisma/client");
// Default client for backward compatibility
const defaultPrisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, arguments, void 0, function* (prisma = defaultPrisma) {
        try {
            console.log("Starting to seed database...");
            // First, ensure the category exists
            console.log("Checking if the software category exists...");
            // Create or update the software category first
            yield prisma.category.upsert({
                where: { categoryId: "CAT_SOFTWARE" },
                update: {
                    nom: "Software", // French for "Software"
                },
                create: {
                    categoryId: "CAT_SOFTWARE",
                    nom: "Software", // French for "Software"
                },
            });
            console.log("Software category created/updated successfully");
            // Now proceed with license types
            console.log("Now seeding license types...");
            // Define license types
            const licenseTypes = [
                // Proprietary Licenses
                {
                    licenseTypeId: "LIC_PERPETUAL",
                    nom: "Licence Perpétuelle",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_SUBSCRIPTION",
                    nom: "Abonnement",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_USER_BASED",
                    nom: "Licence Par Utilisateur",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_CONCURRENT",
                    nom: "Licence Simultanée",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_DEVICE_BASED",
                    nom: "Licence Par Appareil",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_SITE",
                    nom: "Licence de Site",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_ENTERPRISE",
                    nom: "Licence Entreprise",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_VOLUME",
                    nom: "Licence en Volume",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_OEM",
                    nom: "Licence OEM",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_RETAIL",
                    nom: "Licence Commerciale",
                    categoryId: "CAT_SOFTWARE",
                },
                // Cloud/SaaS Licenses
                {
                    licenseTypeId: "LIC_SAAS",
                    nom: "SaaS",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_CLOUD_USAGE",
                    nom: "Utilisation Cloud",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_FREEMIUM",
                    nom: "Freemium",
                    categoryId: "CAT_SOFTWARE",
                },
                // Open Source Licenses
                {
                    licenseTypeId: "LIC_GPL",
                    nom: "GPL",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_LGPL",
                    nom: "LGPL",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_APACHE",
                    nom: "Apache",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_MIT",
                    nom: "MIT",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_BSD",
                    nom: "BSD",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_CREATIVE_COMMONS",
                    nom: "Creative Commons",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_TRIAL",
                    nom: "Version d'Essai",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_NFR",
                    nom: "Not For Resale",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_ACADEMIC",
                    nom: "Licence Académique",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_DEVELOPER",
                    nom: "Licence Développeur",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_FREEWARE",
                    nom: "Freeware",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_SHAREWARE",
                    nom: "Shareware",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_INTERNAL",
                    nom: "Usage Interne",
                    categoryId: "CAT_SOFTWARE",
                },
                {
                    licenseTypeId: "LIC_GOVERNMENT",
                    nom: "Licence Gouvernementale",
                    categoryId: "CAT_SOFTWARE",
                },
            ];
            // Create all the license types with individual try/catch blocks
            for (const licenseType of licenseTypes) {
                try {
                    yield prisma.licenseType.upsert({
                        where: { licenseTypeId: licenseType.licenseTypeId },
                        update: {
                            nom: licenseType.nom,
                            categoryId: licenseType.categoryId,
                        },
                        create: {
                            licenseTypeId: licenseType.licenseTypeId,
                            nom: licenseType.nom,
                            categoryId: licenseType.categoryId,
                        },
                    });
                    console.log(`Created licenseType: ${licenseType.nom}`);
                }
                catch (error) {
                    console.error(`Error creating license type ${licenseType.nom}:`, error);
                    // Continue with other license types instead of stopping the entire script
                }
            }
            console.log("License type database seeding completed!");
        }
        catch (error) {
            console.error("Error in seeding process:", error);
            throw error; // Re-throw to be caught by the main catch block
        }
        // No need to disconnect here, as it will be handled by the calling function
    });
}
// For direct execution of this seed file
if (require.main === module) {
    main()
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield defaultPrisma.$disconnect();
    }))
        .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
        console.error(e);
        yield defaultPrisma.$disconnect();
        process.exit(1);
    }));
}
