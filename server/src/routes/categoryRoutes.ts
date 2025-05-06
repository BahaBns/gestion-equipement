import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  getCategoryById,
} from "../controllers/categoryController";

const router = Router();

// Get all categories or search categories
router.get("/", getCategories);

// Get a category by ID
router.get("/:categoryId", getCategoryById);

// Create a new category
router.post("/", createCategory);

// update category
router.put("/:categoryId", updateCategory);

// delete a category by categoryId
router.delete("/:categoryId", deleteCategory);

export default router;
