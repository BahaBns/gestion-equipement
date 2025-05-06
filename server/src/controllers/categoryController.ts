import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const lagomPrisma = 
  new PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
  })
;

const insightPrisma = 
  new PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
  })
;

// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

/**
 * Generate the next category ID
 */
const generateNextCategoryId = async (req: Request): Promise<string> => {
  const prisma = getPrismaClient(req);

  // Fetch the last category from the database
  const lastCategory = await prisma.category.findFirst({
    orderBy: {
      categoryId: "desc",
    },
  });

  if (!lastCategory) {
    // If no categories exist, start with "CAT-1"
    return "CAT-1";
  }

  // Extract the numeric part of the ID
  const lastIdNumber = parseInt(lastCategory.categoryId.split("-")[1], 10);

  // Increment the numeric part and return the new ID
  return `CAT-${lastIdNumber + 1}`;
};

/**
 * Get all categories or search categories by name
 */
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const search = req.query.search?.toString();
    const categories = await prisma.category.findMany({
      where: search
        ? {
            nom: {
              contains: search,
            },
          }
        : undefined,
      include: {
        actiftype: true,
        licensetype: true, // Include related licenseType records
      },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve categories" });
  }
};

/**
 * Create a new category
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { nom } = req.body;

    // Generate the next category ID
    const categoryId = await generateNextCategoryId(req);

    // Create the category with the generated ID
    const category = await prisma.category.create({
      data: {
        categoryId, // Use the generated ID
        nom,
      },
    });

    // Return the created category
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

/**
 * Update a category by ID
 */
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { categoryId } = req.params;
    const { nom } = req.body;

    // Check if the category exists
    const existingCategory = await prisma.category.findUnique({
      where: { categoryId: categoryId },
    });

    if (!existingCategory) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { categoryId: categoryId },
      data: { nom },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

/**
 * Delete a category by ID
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);

    const { categoryId } = req.params;

    // Check if the category exists
    const category = await prisma.category.findUnique({
      where: { categoryId: categoryId },
      include: {
        actiftype: true,
        licensetype: true, // Check related licenseType records
      },
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Prevent deletion if category has associated actifTypes or licenseTypes
    if (category.actiftype.length > 0 || category.licensetype.length > 0) {
      res.status(400).json({
        message:
          "Cannot delete category because it has associated actif types or license types. Please remove them first.",
      });
      return;
    }

    // Delete the category
    await prisma.category.delete({
      where: { categoryId: categoryId },
    });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};

/**
 * Get a category by ID with its related records
 */
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prisma = getPrismaClient(req);


    const { categoryId } = req.params;

    const category = await prisma.category.findUnique({
      where: { categoryId: categoryId },
      include: {
        actiftype: true,
        licensetype: true, // Include related licenseType records
      },
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error("Error retrieving category:", error);
    res.status(500).json({ message: "Error retrieving category" });
  }
};
