// controllers/hashtagController.ts
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

// Fonction pour générer un ID unique pour un hashtag
const generateHashtagId = (): string => {
  return `htg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const hashtagController = {
  // Récupérer tous les hashtags
  getAllHashtags: async (req: Request, res: Response): Promise<void> => {
    try {
      const prisma = getPrismaClient(req);

      const hashtags = await prisma.hashtag.findMany();
      res.json(hashtags);
    } catch (error) {
      console.error("Erreur lors de la récupération des hashtags:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des hashtags" });
    }
  },

  // Créer un nouveau hashtag
  createHashtag: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: "Le nom du hashtag est requis" });
      return;
    }

    try {
      // Vérifier si le hashtag existe déjà
      const existingHashtag = await prisma.hashtag.findFirst({
        where: { name },
      });

      if (existingHashtag) {
        res.status(409).json({ error: "Un hashtag avec ce nom existe déjà" });
        return;
      }

      // Créer le nouveau hashtag
      const newHashtag = await prisma.hashtag.create({
        data: {
          hashtagId: generateHashtagId(),
          name,
          description,
        },
      });

      res.status(201).json(newHashtag);
    } catch (error) {
      console.error("Erreur lors de la création du hashtag:", error);
      res.status(500).json({ error: "Erreur lors de la création du hashtag" });
    }
  },

  // Récupérer un hashtag par son ID
  getHashtagById: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { id } = req.params;

    try {
      const hashtag = await prisma.hashtag.findUnique({
        where: { hashtagId: id },
        include: {
          actifs: {
            include: {
              actif: true,
            },
          },
          licenses: {
            include: {
              license: true,
            },
          },
        },
      });

      if (!hashtag) {
        res.status(404).json({ error: "Hashtag non trouvé" });
        return;
      }

      res.json(hashtag);
    } catch (error) {
      console.error("Erreur lors de la récupération du hashtag:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du hashtag" });
    }
  },

  // Mettre à jour un hashtag
  updateHashtag: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { id } = req.params;
    const { name, description } = req.body;

    try {
      // Vérifier si le hashtag existe
      const existingHashtag = await prisma.hashtag.findUnique({
        where: { hashtagId: id },
      });

      if (!existingHashtag) {
        res.status(404).json({ error: "Hashtag non trouvé" });
        return;
      }

      // Vérifier si le nouveau nom existe déjà (si le nom a changé)
      if (name && name !== existingHashtag.name) {
        const duplicateName = await prisma.hashtag.findFirst({
          where: { name },
        });

        if (duplicateName) {
          res.status(409).json({ error: "Un hashtag avec ce nom existe déjà" });
          return;
        }
      }

      // Mettre à jour le hashtag
      const updatedHashtag = await prisma.hashtag.update({
        where: { hashtagId: id },
        data: {
          name: name || existingHashtag.name,
          description:
            description !== undefined
              ? description
              : existingHashtag.description,
        },
      });

      res.json(updatedHashtag);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du hashtag:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du hashtag" });
    }
  },

  // Supprimer un hashtag
  deleteHashtag: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { id } = req.params;

    try {
      // Vérifier si le hashtag existe
      const existingHashtag = await prisma.hashtag.findUnique({
        where: { hashtagId: id },
      });

      if (!existingHashtag) {
        res.status(404).json({ error: "Hashtag non trouvé" });
        return;
      }

      // Supprimer d'abord toutes les relations avec les actifs et les licences
      await prisma.$transaction([
        prisma.actifHashtag.deleteMany({
          where: { hashtagId: id },
        }),
        prisma.licenseHashtag.deleteMany({
          where: { hashtagId: id },
        }),
        prisma.hashtag.delete({
          where: { hashtagId: id },
        }),
      ]);

      res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la suppression du hashtag:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du hashtag" });
    }
  },

  // Rechercher des hashtags par nom
  searchHashtags: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { term } = req.params;

    try {
      const hashtags = await prisma.hashtag.findMany({
        where: {
          name: {
            contains: term,
            mode: "insensitive",
          },
        },
      });

      res.json(hashtags);
    } catch (error) {
      console.error("Erreur lors de la recherche des hashtags:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la recherche des hashtags" });
    }
  },

  // Associer un hashtag à un actif
  associateWithActif: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { actifId, hashtagId } = req.body;

    if (!actifId || !hashtagId) {
      res
        .status(400)
        .json({ error: "Les IDs d'actif et de hashtag sont requis" });
      return;
    }

    try {
      // Vérifier si l'actif existe
      const actif = await prisma.actif.findUnique({
        where: { actifId },
      });

      if (!actif) {
        res.status(404).json({ error: "Actif non trouvé" });
        return;
      }

      // Vérifier si le hashtag existe
      const hashtag = await prisma.hashtag.findUnique({
        where: { hashtagId },
      });

      if (!hashtag) {
        res.status(404).json({ error: "Hashtag non trouvé" });
        return;
      }

      // Vérifier si l'association existe déjà
      const existingAssociation = await prisma.actifHashtag.findUnique({
        where: {
          actifId_hashtagId: {
            actifId,
            hashtagId,
          },
        },
      });

      if (existingAssociation) {
        res.status(409).json({ error: "Cette association existe déjà" });
        return;
      }

      // Créer l'association
      const association = await prisma.actifHashtag.create({
        data: {
          actifId,
          hashtagId,
        },
        include: {
          actif: true,
          hashtag: true,
        },
      });

      res.status(201).json(association);
    } catch (error) {
      console.error("Erreur lors de l'association avec l'actif:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'association avec l'actif" });
    }
  },

  // Dissocier un hashtag d'un actif
  dissociateFromActif: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { actifId, hashtagId } = req.body;

    if (!actifId || !hashtagId) {
      res
        .status(400)
        .json({ error: "Les IDs d'actif et de hashtag sont requis" });
      return;
    }

    try {
      // Vérifier si l'association existe
      const association = await prisma.actifHashtag.findUnique({
        where: {
          actifId_hashtagId: {
            actifId,
            hashtagId,
          },
        },
      });

      if (!association) {
        res.status(404).json({ error: "Association non trouvée" });
        return;
      }

      // Supprimer l'association
      await prisma.actifHashtag.delete({
        where: {
          actifId_hashtagId: {
            actifId,
            hashtagId,
          },
        },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la dissociation de l'actif:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la dissociation de l'actif" });
    }
  },

  // Associer un hashtag à une licence
  associateWithLicense: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { licenseId, hashtagId } = req.body;

    if (!licenseId || !hashtagId) {
      res
        .status(400)
        .json({ error: "Les IDs de licence et de hashtag sont requis" });
      return;
    }

    try {
      // Vérifier si la licence existe
      const license = await prisma.license.findUnique({
        where: { licenseId },
      });

      if (!license) {
        res.status(404).json({ error: "Licence non trouvée" });
        return;
      }

      // Vérifier si le hashtag existe
      const hashtag = await prisma.hashtag.findUnique({
        where: { hashtagId },
      });

      if (!hashtag) {
        res.status(404).json({ error: "Hashtag non trouvé" });
        return;
      }

      // Vérifier si l'association existe déjà
      const existingAssociation = await prisma.licenseHashtag.findUnique({
        where: {
          licenseId_hashtagId: {
            licenseId,
            hashtagId,
          },
        },
      });

      if (existingAssociation) {
        res.status(409).json({ error: "Cette association existe déjà" });
        return;
      }

      // Créer l'association
      const association = await prisma.licenseHashtag.create({
        data: {
          licenseId,
          hashtagId,
        },
        include: {
          license: true,
          hashtag: true,
        },
      });

      res.status(201).json(association);
    } catch (error) {
      console.error("Erreur lors de l'association avec la licence:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'association avec la licence" });
    }
  },

  // Dissocier un hashtag d'une licence
  dissociateFromLicense: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { licenseId, hashtagId } = req.body;

    if (!licenseId || !hashtagId) {
      res
        .status(400)
        .json({ error: "Les IDs de licence et de hashtag sont requis" });
      return;
    }

    try {
      // Vérifier si l'association existe
      const association = await prisma.licenseHashtag.findUnique({
        where: {
          licenseId_hashtagId: {
            licenseId,
            hashtagId,
          },
        },
      });

      if (!association) {
        res.status(404).json({ error: "Association non trouvée" });
        return;
      }

      // Supprimer l'association
      await prisma.licenseHashtag.delete({
        where: {
          licenseId_hashtagId: {
            licenseId,
            hashtagId,
          },
        },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la dissociation de la licence:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la dissociation de la licence" });
    }
  },

  // Obtenir les actifs par hashtag
  getActifsByHashtag: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { hashtagId } = req.params;

    try {
      const actifs = await prisma.actif.findMany({
        where: {
          hashtags: {
            some: {
              hashtagId,
            },
          },
        },
        include: {
          status: true,
          etat: true,
          actiftype: {
            include: {
              category: true,
            },
          },
          specification: true,
          employees: {
            include: {
              employee: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      });

      res.json(actifs);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des actifs par hashtag:",
        error
      );
      res.status(500).json({
        error: "Erreur lors de la récupération des actifs par hashtag",
      });
    }
  },

  // Obtenir les licences par hashtag
  getLicensesByHashtag: async (req: Request, res: Response): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { hashtagId } = req.params;

    try {
      const licenses = await prisma.license.findMany({
        where: {
          hashtags: {
            some: {
              hashtagId,
            },
          },
        },
      });

      res.json(licenses);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des licences par hashtag:",
        error
      );
      res.status(500).json({
        error: "Erreur lors de la récupération des licences par hashtag",
      });
    }
  },
  getActifsByMultipleHashtags: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { hashtagIds } = req.body; // Expect an array of hashtag IDs

    if (!hashtagIds || !Array.isArray(hashtagIds) || hashtagIds.length === 0) {
      res
        .status(400)
        .json({ error: "Un tableau d'IDs de hashtags est requis" });
      return;
    }

    try {
      // Find actifs that have ALL the specified hashtags
      const actifs = await prisma.actif.findMany({
        where: {
          AND: hashtagIds.map((hashtagId) => ({
            hashtags: {
              some: {
                hashtagId,
              },
            },
          })),
        },
        include: {
          status: true,
          etat: true,
          actiftype: true,
          specification: true,
          employees: {
            include: {
              employee: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      });

      res.json(actifs);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des actifs par hashtags multiples:",
        error
      );
      res.status(500).json({
        error:
          "Erreur lors de la récupération des actifs par hashtags multiples",
      });
    }
  },

  // Get licenses that have ALL the specified hashtags
  getLicensesByMultipleHashtags: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const prisma = getPrismaClient(req);

    const { hashtagIds } = req.body; // Expect an array of hashtag IDs

    if (!hashtagIds || !Array.isArray(hashtagIds) || hashtagIds.length === 0) {
      res
        .status(400)
        .json({ error: "Un tableau d'IDs de hashtags est requis" });
      return;
    }

    try {
      // Find licenses that have ALL the specified hashtags
      const licenses = await prisma.license.findMany({
        where: {
          AND: hashtagIds.map((hashtagId) => ({
            hashtags: {
              some: {
                hashtagId,
              },
            },
          })),
        },
        include: {
          status: true,
          etat: true,
          licensetype: true,
          employees: {
            include: {
              employee: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      });

      res.json(licenses);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des licenses par hashtags multiples:",
        error
      );
      res.status(500).json({
        error:
          "Erreur lors de la récupération des licenses par hashtags multiples",
      });
    }
  },
};
