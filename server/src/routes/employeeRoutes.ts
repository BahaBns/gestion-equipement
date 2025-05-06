import { Router } from "express";
import {
  getEmployees,
  createEmployee,
  deleteEmployee,
  assignActifs,
  removeActifs,
} from "../controllers/employeeController";

const router = Router();

// Get all employees or search employees
router.get("/", getEmployees);

// Create a new employee
router.post("/", createEmployee);

// Assign actifs to an employee
router.post("/:employeeId/assign-actifs", assignActifs);

// Remove actifs from an employee
router.post("/:employeeId/remove-actifs", removeActifs);

// Delete an employee by employeeId
router.delete("/:employeeId", deleteEmployee);

export default router;
