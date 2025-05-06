"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const router = (0, express_1.Router)();
// Get all categories or search categories
router.get("/", categoryController_1.getCategories);
// Get a category by ID
router.get("/:categoryId", categoryController_1.getCategoryById);
// Create a new category
router.post("/", categoryController_1.createCategory);
// update category
router.put("/:categoryId", categoryController_1.updateCategory);
// delete a category by categoryId
router.delete("/:categoryId", categoryController_1.deleteCategory);
exports.default = router;
