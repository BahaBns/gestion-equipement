"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController_1 = require("../controllers/employeeController");
const router = (0, express_1.Router)();
// Get all employees or search employees
router.get("/", employeeController_1.getEmployees);
// Create a new employee
router.post("/", employeeController_1.createEmployee);
router.put("/:employeeId", employeeController_1.modifyEmployee);
// Assign actifs to an employee
router.post("/:employeeId/assign-actifs", employeeController_1.assignActifs);
// Remove actifs from an employee
router.post("/:employeeId/remove-actifs", employeeController_1.removeActifs);
// Delete an employee by employeeId
router.delete("/:employeeId", employeeController_1.deleteEmployee);
exports.default = router;
