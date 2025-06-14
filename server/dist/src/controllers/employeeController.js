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
exports.modifyEmployee = exports.removeActifs = exports.assignActifs = exports.deleteEmployee = exports.createEmployee = exports.getEmployees = void 0;
const client_1 = require("@prisma/client");
const lagomPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
/**
 * Generate Employee ID
 * Format: EM00<number>
 */
const generateEmployeeId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
    const lastEmployee = yield prisma.employee.findFirst({
        orderBy: {
            employeeId: "desc", // Get the last employee by ID
        },
    });
    const lastNumber = lastEmployee
        ? parseInt(lastEmployee.employeeId.replace("EM00", ""), 10)
        : 0; // Extract the numeric part or start from 0
    const nextNumber = lastNumber + 1;
    return `EM00${nextNumber.toString().padStart(4, "0")}`; // Ensure 4-digit padding
});
/**
 * Updated getEmployees function with assignment-level status
 */
const getEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const employees = yield prisma.employee.findMany({
            include: {
                actifs: {
                    include: {
                        actif: true,
                        status: true, // ✅ Assignment-level status (you already have this)
                    },
                },
                licenses: {
                    include: {
                        license: {
                            include: {
                                status: true,
                                licensetype: true,
                            },
                        },
                        status: true, // ✅ Add assignment-level status for licenses too
                    },
                },
            },
        });
        // Transform the data structure - UPDATED to include assignment-level status
        const transformedEmployees = employees.map((employee) => {
            return Object.assign(Object.assign({}, employee), { actifs: employee.actifs.map((ea) => (Object.assign(Object.assign({}, ea.actif), { quantity: ea.quantity, assignedAt: ea.assignedAt, 
                    // 🔥 ADD THESE LINES - Include assignment-level status
                    assignmentStatus: ea.status, assignmentStatusId: ea.statusId }))), licenses: employee.licenses.map((el) => (Object.assign(Object.assign({}, el.license), { quantity: el.quantity, assignedAt: el.assignedAt, 
                    // 🔥 ADD THESE LINES - Include assignment-level status for licenses
                    assignmentStatus: el.status, assignmentStatusId: el.statusId }))) });
        });
        res.json(transformedEmployees);
    }
    catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ message: "Error fetching employees", error: error });
    }
});
exports.getEmployees = getEmployees;
/**
 * Create a new employee
 */
const createEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { nom, email, actifIds } = req.body; // Employee details and optional actif IDs
        // Generate the employee ID
        const employeeId = yield generateEmployeeId(req);
        // Use a transaction to handle multiple operations
        const result = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the employee
            const employee = yield prismaClient.employee.create({
                data: {
                    employeeId,
                    nom,
                    email,
                },
            });
            // If actifIds are provided, create the relationships
            if (actifIds && Array.isArray(actifIds) && actifIds.length > 0) {
                for (const actifId of actifIds) {
                    // Check if actif exists
                    const actif = yield prismaClient.actif.findUnique({
                        where: { actifId },
                    });
                    if (actif) {
                        yield prismaClient.employeeActif.create({
                            data: {
                                employeeId,
                                actifId,
                                assignedAt: new Date(),
                            },
                        });
                    }
                }
            }
            // Return the created employee with relationships
            return yield prismaClient.employee.findUnique({
                where: { employeeId },
                include: {
                    actifs: {
                        include: {
                            actif: true,
                        },
                    },
                },
            });
        }));
        // Return the created employee
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ message: "Error creating employee" });
    }
});
exports.createEmployee = createEmployee;
/**
 * Delete an employee by employeeId
 */
const deleteEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        // Check if employee exists
        const employee = yield prisma.employee.findUnique({
            where: { employeeId },
        });
        // If employee not found, send a 404 response
        if (!employee) {
            res.status(404).json({ message: "Employee not found" });
            return;
        }
        // Use transaction to handle multiple operations
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete all employeeActif relationships
            yield prismaClient.employeeActif.deleteMany({
                where: { employeeId },
            });
            // Delete all employeeLicense relationships
            yield prismaClient.employeeLicense.deleteMany({
                where: { employeeId },
            });
            // Delete all assignmentTokens for this employee
            yield prismaClient.assignmentToken.deleteMany({
                where: { employeeId },
            });
            // Delete all activity logs for this employee
            yield prismaClient.activityLog.deleteMany({
                where: { employeeId },
            });
            // Then delete the employee
            yield prismaClient.employee.delete({
                where: { employeeId },
            });
        }));
        // Return a success message
        res
            .status(200)
            .json({ message: `Employee with ID ${employeeId} deleted successfully` });
    }
    catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ message: "Error deleting employee" });
    }
});
exports.deleteEmployee = deleteEmployee;
/**
 * Assign actifs to an employee
 */
const assignActifs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { actifIds } = req.body;
        // Validate input
        if (!Array.isArray(actifIds) || actifIds.length === 0) {
            res.status(400).json({ message: "Invalid actifs selection" });
            return;
        }
        // Check if employee exists
        const employee = yield prisma.employee.findUnique({
            where: { employeeId },
        });
        if (!employee) {
            res.status(404).json({ message: "Employee not found" });
            return;
        }
        // Use transaction to handle multiple operations
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // For each actifId, create a relationship in EmployeeActif
            for (const actifId of actifIds) {
                // Check if actif exists
                const actif = yield prismaClient.actif.findUnique({
                    where: { actifId },
                });
                if (actif) {
                    // Check if relationship already exists
                    const existingRelation = yield prismaClient.employeeActif.findUnique({
                        where: {
                            employeeId_actifId: {
                                employeeId,
                                actifId,
                            },
                        },
                    });
                    // Only create if it doesn't exist
                    if (!existingRelation) {
                        yield prismaClient.employeeActif.create({
                            data: {
                                employeeId,
                                actifId,
                                assignedAt: new Date(),
                            },
                        });
                    }
                }
            }
        }));
        res
            .status(200)
            .json({ message: "Actifs successfully assigned to employee" });
    }
    catch (error) {
        console.error("Error assigning actifs:", error);
        res.status(500).json({ message: "Error assigning actifs" });
    }
});
exports.assignActifs = assignActifs;
/**
 * Remove actifs from an employee
 */
const removeActifs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { actifIds } = req.body;
        // Validate input
        if (!Array.isArray(actifIds) || actifIds.length === 0) {
            res.status(400).json({ message: "Invalid actifs selection" });
            return;
        }
        // Delete the specified relationships
        yield prisma.employeeActif.deleteMany({
            where: {
                employeeId,
                actifId: {
                    in: actifIds,
                },
            },
        });
        res
            .status(200)
            .json({ message: "Actifs successfully removed from employee" });
    }
    catch (error) {
        console.error("Error removing actifs:", error);
        res.status(500).json({ message: "Error removing actifs" });
    }
});
exports.removeActifs = removeActifs;
/**
 * Update/modify an existing employee
 */
const modifyEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { nom, email } = req.body;
        // Check if employee exists
        const employee = yield prisma.employee.findUnique({
            where: { employeeId },
        });
        if (!employee) {
            res.status(404).json({ message: "Employee not found" });
            return;
        }
        // Update the employee
        const updatedEmployee = yield prisma.employee.update({
            where: { employeeId },
            data: Object.assign(Object.assign({}, (nom && { nom })), (email && { email })),
            include: {
                actifs: {
                    include: {
                        actif: true,
                    },
                },
                licenses: {
                    include: {
                        license: {
                            include: {
                                status: true,
                                licensetype: true,
                            },
                        },
                    },
                },
            },
        });
        // Transform the data structure to match the getEmployees format
        const transformedEmployee = Object.assign(Object.assign({}, updatedEmployee), { actifs: updatedEmployee.actifs.map((ea) => (Object.assign(Object.assign({}, ea.actif), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), licenses: updatedEmployee.licenses.map((el) => (Object.assign(Object.assign({}, el.license), { quantity: el.quantity, assignedAt: el.assignedAt }))) });
        res.status(200).json(transformedEmployee);
    }
    catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ message: "Error updating employee", error });
    }
});
exports.modifyEmployee = modifyEmployee;
