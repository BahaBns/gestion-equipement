import { PrismaClient } from "@prisma/client";

// Default client for backward compatibility
const defaultPrisma = new PrismaClient();

export async function main(prisma: PrismaClient = defaultPrisma) {
  try {
    console.log("Starting to seed database...");

    // ======= SEED HARDWARE CATEGORY =======
    console.log("Seeding hardware category...");

    // Create the hardware category
    const hardwareCategory = await prisma.category.upsert({
      where: { categoryId: "CAT_HARDWARE" },
      update: { nom: "Hardware" },
      create: {
        categoryId: "CAT_HARDWARE",
        nom: "Hardware",
      },
    });

    console.log(`Created category: ${hardwareCategory.nom}`);

    // Define actifTypes for hardware category based on the provided list
    const hardwareActifTypes = [
      // Computers
      {
        actifTypeId: "HW_LAPTOP",
        nom: "Ordinateurs portables",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_DESKTOP",
        nom: "Ordinateur de bureau",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_MONITOR", nom: "Ecran", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_TOWER",
        nom: "Unité central",
        categoryId: "CAT_HARDWARE",
      },

      // Tablets
      {
        actifTypeId: "HW_TABLET",
        nom: "Tablettes Tactiles",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_GRAPHIC_TABLET",
        nom: "Tablette Graphique",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_IPAD", nom: "iPad", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_TABLET_ACC",
        nom: "Accessoires Tablette",
        categoryId: "CAT_HARDWARE",
      },

      // Peripherals & Accessories
      {
        actifTypeId: "HW_PERIPH",
        nom: "Périphériques & Accessoires",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_BAG",
        nom: "Sacs & Sacoches",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_KEYBOARD",
        nom: "Clavier",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_MOUSE", nom: "Souris", categoryId: "CAT_HARDWARE" },
      { actifTypeId: "HW_MOUSEPAD", nom: "Tapis", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_POWERBANK",
        nom: "Power Bank",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_COOLER",
        nom: "Refroidisseurs PC Portable",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_USB_HUB", nom: "Hub USB", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_SCREEN_STAND",
        nom: "Support Ecran",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_WEBCAM", nom: "Webcam", categoryId: "CAT_HARDWARE" },

      // Computer Components
      {
        actifTypeId: "HW_COMP",
        nom: "Composants Informatique",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_CPU", nom: "Processeur", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_GPU",
        nom: "Carte Graphique",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_RAM",
        nom: "Barrettes Mémoire",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_MOTHERBOARD",
        nom: "Carte Mère",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_CASE", nom: "Boîtier", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_PSU",
        nom: "Bloc d'alimentation",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_LAPTOP_CHARGER",
        nom: "Chargeur PC Portable",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_LAPTOP_BATTERY",
        nom: "Batterie PC Portable",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_LAPTOP_DISPLAY",
        nom: "Afficheur PC Portable",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_FAN", nom: "Ventilateur", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_OPTICAL_DRIVE",
        nom: "Graveurs et Lecteurs",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_LAPTOP_KB",
        nom: "Clavier PC Portable",
        categoryId: "CAT_HARDWARE",
      },

      // Storage
      {
        actifTypeId: "HW_STORAGE",
        nom: "Stockage",
        categoryId: "CAT_HARDWARE",
      },
      { actifTypeId: "HW_HDD", nom: "Disque Dur", categoryId: "CAT_HARDWARE" },
      {
        actifTypeId: "HW_USB_DRIVE",
        nom: "Clé USB",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_MEMORY_CARD",
        nom: "Carte Mémoire",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_STORAGE_ACC",
        nom: "Accessoires de Stockage",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_OPTICAL_MEDIA",
        nom: "CD & DVD",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_CARD_READER",
        nom: "Lecteur de Cartes Mémoire",
        categoryId: "CAT_HARDWARE",
      },

      // Servers and Conference Equipment
      {
        actifTypeId: "HW_SERVER_RACK",
        nom: "Serveur Rack",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_SERVER_TOWER",
        nom: "Serveur Tour",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_PROJECTOR",
        nom: "Vidéo projecteur",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_CONF_SPEAKER",
        nom: "Haut-Parleur de Conférence",
        categoryId: "CAT_HARDWARE",
      },
      {
        actifTypeId: "HW_MODULAR_MIC",
        nom: "Microphone Modulable",
        categoryId: "CAT_HARDWARE",
      },
    ];

    // Create all the hardware actifTypes
    for (const actifType of hardwareActifTypes) {
      await prisma.actifType.upsert({
        where: { actifTypeId: actifType.actifTypeId },
        update: {
          nom: actifType.nom,
          categoryId: actifType.categoryId,
        },
        create: {
          actifTypeId: actifType.actifTypeId,
          nom: actifType.nom,
          categoryId: actifType.categoryId,
        },
      });
      console.log(`Created actifType: ${actifType.nom}`);
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
  // No need to disconnect here, as it will be handled by the calling function
}

// For direct execution of this seed file
if (require.main === module) {
  main()
    .then(async () => {
      await defaultPrisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await defaultPrisma.$disconnect();
      process.exit(1);
    });
}
