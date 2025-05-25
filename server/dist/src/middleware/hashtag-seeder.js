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
exports.seedHashtagsFromExistingData = seedHashtagsFromExistingData;
exports.autoTagActif = autoTagActif;
exports.autoTagLicense = autoTagLicense;
exports.seedAndTagAll = seedAndTagAll;
// hashtag-seeder.ts
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
/**
 * Normalizes a string to be used as a hashtag
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Removes special characters
 */
function normalizeHashtagName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]/g, "")
        .replace(/\-+/g, "-"); // Replace multiple dashes with a single dash
}
/**
 * Creates a hashtag if it doesn't exist already
 */
function createHashtagIfNotExist(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedName = normalizeHashtagName(name);
        if (!normalizedName)
            return ""; // Skip empty names
        // Try to find existing hashtag
        let hashtag = yield prisma.hashtag.findUnique({
            where: { name: normalizedName },
        });
        // Create if it doesn't exist
        if (!hashtag) {
            hashtag = yield prisma.hashtag.create({
                data: {
                    hashtagId: (0, uuid_1.v4)(),
                    name: normalizedName,
                    description: `Auto-generated from ${name}`,
                },
            });
            console.log(`Created hashtag: ${normalizedName}`);
        }
        return hashtag.hashtagId;
    });
}
/**
 * Seeds hashtags from existing data in the database
 */
function seedHashtagsFromExistingData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting hashtag seeding from existing data...");
        try {
            // 1. Seed from Actif Types
            const actifTypes = yield prisma.actifType.findMany();
            for (const type of actifTypes) {
                yield createHashtagIfNotExist(type.nom);
            }
            // 2. Seed from unique Marques in Actifs
            const marques = yield prisma.marque.findMany({
                select: { name: true },
                distinct: ["name"], // Use name instead of marque
            });
            for (const marque of marques) {
                yield createHashtagIfNotExist(marque.name);
            }
            // 3. Seed from Statuses
            const statuses = yield prisma.status.findMany();
            for (const status of statuses) {
                yield createHashtagIfNotExist(status.name);
            }
            // 4. Seed from License Types
            const licenseTypes = yield prisma.licenseType.findMany();
            for (const type of licenseTypes) {
                yield createHashtagIfNotExist(type.nom);
            }
            // 5. Seed from Categories
            const categories = yield prisma.category.findMany();
            for (const category of categories) {
                yield createHashtagIfNotExist(category.nom);
            }
            console.log("Hashtag seeding completed successfully!");
        }
        catch (error) {
            console.error("Error seeding hashtags:", error);
        }
    });
}
/**
 * Auto-tags an Actif with relevant hashtags
 */
function autoTagActif(actifId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Get the actif with its relations
            const actif = yield prisma.actif.findUnique({
                where: { actifId },
                include: {
                    actiftype: true,
                    status: true,
                },
            });
            if (!actif)
                return;
            // Create hashtags array
            const hashtagsToAssociate = [];
            // 1. Add actifType as hashtag
            if ((_a = actif.actiftype) === null || _a === void 0 ? void 0 : _a.nom) {
                const typeHashtagId = yield createHashtagIfNotExist(actif.actiftype.nom);
                if (typeHashtagId)
                    hashtagsToAssociate.push(typeHashtagId);
            }
            // 2. Add marque as hashtag
            if (actif.marqueId) {
                const marque = yield prisma.marque.findUnique({
                    where: { marqueId: actif.marqueId },
                    select: { name: true },
                });
                if (marque === null || marque === void 0 ? void 0 : marque.name) {
                    const marqueHashtagId = yield createHashtagIfNotExist(marque.name);
                    if (marqueHashtagId)
                        hashtagsToAssociate.push(marqueHashtagId);
                }
            }
            // 3. Add status as hashtag
            if ((_b = actif.status) === null || _b === void 0 ? void 0 : _b.name) {
                const statusHashtagId = yield createHashtagIfNotExist(actif.status.name);
                if (statusHashtagId)
                    hashtagsToAssociate.push(statusHashtagId);
            }
            // Associate the hashtags with the actif
            for (const hashtagId of hashtagsToAssociate) {
                // Check if association already exists
                const existingAssociation = yield prisma.actifHashtag.findUnique({
                    where: {
                        actifId_hashtagId: {
                            actifId: actif.actifId,
                            hashtagId,
                        },
                    },
                });
                // Create association if it doesn't exist
                if (!existingAssociation) {
                    yield prisma.actifHashtag.create({
                        data: {
                            actifId: actif.actifId,
                            hashtagId,
                        },
                    });
                    console.log(`Associated actif ${actif.actifId} with hashtag ${hashtagId}`);
                }
            }
            console.log(`Auto-tagging completed for actif ${actifId}`);
            return true;
        }
        catch (error) {
            console.error(`Error auto-tagging actif ${actifId}:`, error);
            return false;
        }
    });
}
/**
 * Auto-tags a License with relevant hashtags
 */
function autoTagLicense(licenseId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Get the license with its relations
            const license = yield prisma.license.findUnique({
                where: { licenseId },
                include: {
                    licensetype: true,
                    status: true,
                },
            });
            if (!license)
                return;
            // Create hashtags array
            const hashtagsToAssociate = [];
            // 1. Add licenseType as hashtag
            if ((_a = license.licensetype) === null || _a === void 0 ? void 0 : _a.nom) {
                const typeHashtagId = yield createHashtagIfNotExist(license.licensetype.nom);
                if (typeHashtagId)
                    hashtagsToAssociate.push(typeHashtagId);
            }
            // 2. Add software name as hashtag
            if (license.softwareName) {
                const softwareHashtagId = yield createHashtagIfNotExist(license.softwareName);
                if (softwareHashtagId)
                    hashtagsToAssociate.push(softwareHashtagId);
            }
            // 3. Add vendor name as hashtag
            if (license.vendorName) {
                const vendorHashtagId = yield createHashtagIfNotExist(license.vendorName);
                if (vendorHashtagId)
                    hashtagsToAssociate.push(vendorHashtagId);
            }
            // 4. Add status as hashtag
            if ((_b = license.status) === null || _b === void 0 ? void 0 : _b.name) {
                const statusHashtagId = yield createHashtagIfNotExist(license.status.name);
                if (statusHashtagId)
                    hashtagsToAssociate.push(statusHashtagId);
            }
            // 5. Add expiry status hashtag
            const now = new Date();
            if (license.expiryDate) {
                if (license.expiryDate < now) {
                    const expiredHashtagId = yield createHashtagIfNotExist("expired");
                    if (expiredHashtagId)
                        hashtagsToAssociate.push(expiredHashtagId);
                }
                else {
                    // Check if expiring in the next 30 days
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(now.getDate() + 30);
                    if (license.expiryDate < thirtyDaysFromNow) {
                        const expiringHashtagId = yield createHashtagIfNotExist("expiring-soon");
                        if (expiringHashtagId)
                            hashtagsToAssociate.push(expiringHashtagId);
                    }
                    else {
                        const activeHashtagId = yield createHashtagIfNotExist("active");
                        if (activeHashtagId)
                            hashtagsToAssociate.push(activeHashtagId);
                    }
                }
            }
            // Associate the hashtags with the license
            for (const hashtagId of hashtagsToAssociate) {
                // Check if association already exists
                const existingAssociation = yield prisma.licenseHashtag.findUnique({
                    where: {
                        licenseId_hashtagId: {
                            licenseId: license.licenseId,
                            hashtagId,
                        },
                    },
                });
                // Create association if it doesn't exist
                if (!existingAssociation) {
                    yield prisma.licenseHashtag.create({
                        data: {
                            licenseId: license.licenseId,
                            hashtagId,
                        },
                    });
                    console.log(`Associated license ${license.licenseId} with hashtag ${hashtagId}`);
                }
            }
            console.log(`Auto-tagging completed for license ${licenseId}`);
            return true;
        }
        catch (error) {
            console.error(`Error auto-tagging license ${licenseId}:`, error);
            return false;
        }
    });
}
/**
 * Seed hashtags and auto-tag all existing actifs and licenses
 */
function seedAndTagAll() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // First seed hashtags from existing data
            yield seedHashtagsFromExistingData();
            // Get all actifs and auto-tag them
            const actifs = yield prisma.actif.findMany();
            console.log(`Auto-tagging ${actifs.length} actifs...`);
            for (const actif of actifs) {
                yield autoTagActif(actif.actifId);
            }
            // Get all licenses and auto-tag them
            const licenses = yield prisma.license.findMany();
            console.log(`Auto-tagging ${licenses.length} licenses...`);
            for (const license of licenses) {
                yield autoTagLicense(license.licenseId);
            }
            console.log("Seeding and auto-tagging completed successfully!");
        }
        catch (error) {
            console.error("Error during seed and auto-tag process:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the full seed and tag process if executed directly
if (require.main === module) {
    seedAndTagAll()
        .then(() => console.log("Hashtag initialization complete!"))
        .catch((e) => console.error("Error in hashtag initialization:", e));
}
