// hashtag-seeder.ts
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * Normalizes a string to be used as a hashtag
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Removes special characters
 */
function normalizeHashtagName(name: string): string {
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
async function createHashtagIfNotExist(name: string): Promise<string> {
  const normalizedName = normalizeHashtagName(name);

  if (!normalizedName) return ""; // Skip empty names

  // Try to find existing hashtag
  let hashtag = await prisma.hashtag.findUnique({
    where: { name: normalizedName },
  });

  // Create if it doesn't exist
  if (!hashtag) {
    hashtag = await prisma.hashtag.create({
      data: {
        hashtagId: uuidv4(),
        name: normalizedName,
        description: `Auto-generated from ${name}`,
      },
    });
    console.log(`Created hashtag: ${normalizedName}`);
  }

  return hashtag.hashtagId;
}

/**
 * Seeds hashtags from existing data in the database
 */
export async function seedHashtagsFromExistingData() {
  console.log("Starting hashtag seeding from existing data...");

  try {
    // 1. Seed from Actif Types
    const actifTypes = await prisma.actifType.findMany();
    for (const type of actifTypes) {
      await createHashtagIfNotExist(type.nom);
    }

    // 2. Seed from unique Marques in Actifs
    const marques = await prisma.marque.findMany({
      select: { name: true },
      distinct: ["name"], // Use name instead of marque
    });

    for (const marque of marques) {
      await createHashtagIfNotExist(marque.name);
    }

    // 3. Seed from Statuses
    const statuses = await prisma.status.findMany();
    for (const status of statuses) {
      await createHashtagIfNotExist(status.name);
    }

    // 4. Seed from License Types
    const licenseTypes = await prisma.licenseType.findMany();
    for (const type of licenseTypes) {
      await createHashtagIfNotExist(type.nom);
    }

    // 5. Seed from Categories
    const categories = await prisma.category.findMany();
    for (const category of categories) {
      await createHashtagIfNotExist(category.nom);
    }

    console.log("Hashtag seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding hashtags:", error);
  }
}

/**
 * Auto-tags an Actif with relevant hashtags
 */
export async function autoTagActif(actifId: string) {
  try {
    // Get the actif with its relations
    const actif = await prisma.actif.findUnique({
      where: { actifId },
      include: {
        actiftype: true,
        status: true,
      },
    });

    if (!actif) return;

    // Create hashtags array
    const hashtagsToAssociate = [];

    // 1. Add actifType as hashtag
    if (actif.actiftype?.nom) {
      const typeHashtagId = await createHashtagIfNotExist(actif.actiftype.nom);
      if (typeHashtagId) hashtagsToAssociate.push(typeHashtagId);
    }

    // 2. Add marque as hashtag
    if (actif.marqueId) {
      const marque = await prisma.marque.findUnique({
        where: { marqueId: actif.marqueId },
        select: { name: true },
      });

      if (marque?.name) {
        const marqueHashtagId = await createHashtagIfNotExist(marque.name);
        if (marqueHashtagId) hashtagsToAssociate.push(marqueHashtagId);
      }
    }

    // 3. Add status as hashtag
    if (actif.status?.name) {
      const statusHashtagId = await createHashtagIfNotExist(actif.status.name);
      if (statusHashtagId) hashtagsToAssociate.push(statusHashtagId);
    }

    // Associate the hashtags with the actif
    for (const hashtagId of hashtagsToAssociate) {
      // Check if association already exists
      const existingAssociation = await prisma.actifHashtag.findUnique({
        where: {
          actifId_hashtagId: {
            actifId: actif.actifId,
            hashtagId,
          },
        },
      });

      // Create association if it doesn't exist
      if (!existingAssociation) {
        await prisma.actifHashtag.create({
          data: {
            actifId: actif.actifId,
            hashtagId,
          },
        });
        console.log(
          `Associated actif ${actif.actifId} with hashtag ${hashtagId}`
        );
      }
    }

    console.log(`Auto-tagging completed for actif ${actifId}`);
    return true;
  } catch (error) {
    console.error(`Error auto-tagging actif ${actifId}:`, error);
    return false;
  }
}

/**
 * Auto-tags a License with relevant hashtags
 */
export async function autoTagLicense(licenseId: string) {
  try {
    // Get the license with its relations
    const license = await prisma.license.findUnique({
      where: { licenseId },
      include: {
        licensetype: true,
        status: true,
      },
    });

    if (!license) return;

    // Create hashtags array
    const hashtagsToAssociate = [];

    // 1. Add licenseType as hashtag
    if (license.licensetype?.nom) {
      const typeHashtagId = await createHashtagIfNotExist(
        license.licensetype.nom
      );
      if (typeHashtagId) hashtagsToAssociate.push(typeHashtagId);
    }

    // 2. Add software name as hashtag
    if (license.softwareName) {
      const softwareHashtagId = await createHashtagIfNotExist(
        license.softwareName
      );
      if (softwareHashtagId) hashtagsToAssociate.push(softwareHashtagId);
    }

    // 3. Add vendor name as hashtag
    if (license.vendorName) {
      const vendorHashtagId = await createHashtagIfNotExist(license.vendorName);
      if (vendorHashtagId) hashtagsToAssociate.push(vendorHashtagId);
    }

    // 4. Add status as hashtag
    if (license.status?.name) {
      const statusHashtagId = await createHashtagIfNotExist(
        license.status.name
      );
      if (statusHashtagId) hashtagsToAssociate.push(statusHashtagId);
    }

    // 5. Add expiry status hashtag
    const now = new Date();
    if (license.expiryDate) {
      if (license.expiryDate < now) {
        const expiredHashtagId = await createHashtagIfNotExist("expired");
        if (expiredHashtagId) hashtagsToAssociate.push(expiredHashtagId);
      } else {
        // Check if expiring in the next 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        if (license.expiryDate < thirtyDaysFromNow) {
          const expiringHashtagId = await createHashtagIfNotExist(
            "expiring-soon"
          );
          if (expiringHashtagId) hashtagsToAssociate.push(expiringHashtagId);
        } else {
          const activeHashtagId = await createHashtagIfNotExist("active");
          if (activeHashtagId) hashtagsToAssociate.push(activeHashtagId);
        }
      }
    }

    // Associate the hashtags with the license
    for (const hashtagId of hashtagsToAssociate) {
      // Check if association already exists
      const existingAssociation = await prisma.licenseHashtag.findUnique({
        where: {
          licenseId_hashtagId: {
            licenseId: license.licenseId,
            hashtagId,
          },
        },
      });

      // Create association if it doesn't exist
      if (!existingAssociation) {
        await prisma.licenseHashtag.create({
          data: {
            licenseId: license.licenseId,
            hashtagId,
          },
        });
        console.log(
          `Associated license ${license.licenseId} with hashtag ${hashtagId}`
        );
      }
    }

    console.log(`Auto-tagging completed for license ${licenseId}`);
    return true;
  } catch (error) {
    console.error(`Error auto-tagging license ${licenseId}:`, error);
    return false;
  }
}

/**
 * Seed hashtags and auto-tag all existing actifs and licenses
 */
export async function seedAndTagAll() {
  try {
    // First seed hashtags from existing data
    await seedHashtagsFromExistingData();

    // Get all actifs and auto-tag them
    const actifs = await prisma.actif.findMany();
    console.log(`Auto-tagging ${actifs.length} actifs...`);
    for (const actif of actifs) {
      await autoTagActif(actif.actifId);
    }

    // Get all licenses and auto-tag them
    const licenses = await prisma.license.findMany();
    console.log(`Auto-tagging ${licenses.length} licenses...`);
    for (const license of licenses) {
      await autoTagLicense(license.licenseId);
    }

    console.log("Seeding and auto-tagging completed successfully!");
  } catch (error) {
    console.error("Error during seed and auto-tag process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the full seed and tag process if executed directly
if (require.main === module) {
  seedAndTagAll()
    .then(() => console.log("Hashtag initialization complete!"))
    .catch((e) => console.error("Error in hashtag initialization:", e));
}
