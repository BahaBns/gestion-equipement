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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLicenseEtat = exports.getLicensesBySoftware = exports.getLicenseUsageStats = exports.renewLicense = exports.getExpiredLicenses = exports.getExpiringLicenses = exports.getLicensesByEtat = exports.getLicensesByType = exports.updateLicenseExpiry = exports.getLicenseAttachments = exports.getLicenseById = exports.getLicenseAssignments = exports.removeLicensesFromEmployee = exports.assignLicensesToEmployee = exports.deleteLicense = exports.updateLicense = exports.createLicense = exports.getLicenses = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auto_tagMidlleware_1 = require("../middleware/auto-tagMidlleware");
const tokenService_1 = require("../services/tokenService");
const emailServices_1 = require("../services/emailServices");
const lagomPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
}));
const insightPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
}));
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
// Set up multer storage configuration for license attachments
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(process.cwd(), "uploads/licenses");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename);
    },
});
// Configure multer upload
exports.upload = (0, multer_1.default)({
    storage: storage,
});
/**
 * Generate unique license ID
 */
const generateLicenseId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
    const lastLicense = yield prisma.license.findFirst({
        orderBy: {
            licenseId: "desc",
        },
    });
    const lastNumber = lastLicense
        ? parseInt(lastLicense.licenseId.replace("LIC00", ""), 10)
        : 0;
    const nextNumber = lastNumber + 1;
    return `LIC00${nextNumber.toString().padStart(4, "0")}`;
});
/**
 * Get all Licenses or search by name
 */
const getLicenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const licenses = yield prisma.license.findMany({
            where: search
                ? {
                    OR: [
                        {
                            softwareName: {
                                contains: search,
                            },
                        },
                        {
                            version: {
                                contains: search,
                            },
                        },
                        {
                            licenseType: {
                                contains: search,
                            },
                        },
                        {
                            licenseId: {
                                contains: search,
                            },
                        },
                        {
                            vendorName: {
                                contains: search,
                            },
                        },
                        {
                            licenseKey: {
                                contains: search,
                            },
                        },
                    ],
                }
                : undefined,
            include: {
                licensetype: true,
                status: true,
                etat: true,
                attachments: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedLicenses = licenses.map((license) => (Object.assign(Object.assign({}, license), { 
            // Include the quantity in the transformed data
            employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving licenses:", error);
        res.status(500).json({ message: "Failed to retrieve licenses" });
    }
});
exports.getLicenses = getLicenses;
/**
 * Create a new License with file upload support
 */
const createLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);
        // Extract values directly from req.body
        const softwareName = req.body.softwareName;
        const version = req.body.version;
        const licenseType = req.body.licenseType;
        const licenseQuantity = req.body.licenseQuantity;
        const startDate = req.body.startDate;
        const expiryDate = req.body.expiryDate;
        const assignedTo = req.body.assignedTo;
        const licenseTypeId = req.body.licenseTypeId;
        const statusId = req.body.statusId;
        const etatId = req.body.etatId;
        const employeeId = req.body.employeeId;
        const createNewEmployee = req.body.createNewEmployee;
        const newEmployeeName = req.body.newEmployeeName;
        const newEmployeeEmail = req.body.newEmployeeEmail;
        const assignQuantity = req.body.assignQuantity;
        // Additional fields
        const licenseKey = req.body.licenseKey;
        const vendorName = req.body.vendorName;
        const vendorContact = req.body.vendorContact;
        const supportContact = req.body.supportContact;
        // Validate required fields
        if (!softwareName ||
            !version ||
            !licenseType ||
            !licenseQuantity ||
            !startDate ||
            !expiryDate ||
            !licenseTypeId ||
            !statusId ||
            !etatId ||
            !vendorName) {
            res.status(400).json({ message: "Required fields are missing" });
            return;
        }
        // Validate status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(400).json({ message: "Invalid status ID" });
            return;
        }
        // Validate etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(400).json({ message: "Invalid etat ID" });
            return;
        }
        // Parse and validate quantity
        const parsedLicenseQuantity = parseInt(licenseQuantity, 10);
        if (isNaN(parsedLicenseQuantity) || parsedLicenseQuantity <= 0) {
            res.status(400).json({ message: "Invalid license quantity value" });
            return;
        }
        // Get the quantity to assign (defaults to 1)
        const parsedAssignQuantity = assignQuantity
            ? parseInt(assignQuantity, 10)
            : 1;
        // Parse dates
        let parsedStartDate;
        let parsedExpiryDate;
        try {
            parsedStartDate = new Date(startDate);
            parsedExpiryDate = new Date(expiryDate);
            if (isNaN(parsedStartDate.getTime()) ||
                isNaN(parsedExpiryDate.getTime())) {
                res.status(400).json({ message: "Invalid date format" });
                return;
            }
            if (parsedExpiryDate <= parsedStartDate) {
                res
                    .status(400)
                    .json({ message: "Expiry date must be after start date" });
                return;
            }
        }
        catch (error) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        // Validate licenseTypeId
        const licenseTypeObj = yield prisma.licenseType.findUnique({
            where: { licenseTypeId },
        });
        if (!licenseTypeObj) {
            res.status(400).json({ message: "Invalid license type ID" });
            return;
        }
        // Generate licenseId
        const licenseId = yield generateLicenseId(req);
        // Start a transaction to handle multiple operations
        const newLicense = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the new License
            const createdLicense = yield prismaClient.license.create({
                data: {
                    licenseId,
                    softwareName,
                    version,
                    licenseType,
                    licenseQuantity: parsedLicenseQuantity,
                    startDate: parsedStartDate,
                    expiryDate: parsedExpiryDate,
                    assignedTo,
                    licenseTypeId,
                    statusId,
                    etatId,
                    licenseKey: licenseKey || "",
                    vendorName,
                    vendorContact: vendorContact || "",
                    supportContact: supportContact || "",
                },
            });
            // Handle file uploads if files are present
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    // Create a relative path for storage in DB
                    const relativePath = `/uploads/licenses/${file.filename}`;
                    // Create attachment record in database
                    yield prismaClient.licenseAttachment.create({
                        data: {
                            attachmentId: `LATT-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                            licenseId: createdLicense.licenseId,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileUrl: relativePath,
                        },
                    });
                }
            }
            return createdLicense;
        }));
        // Handle employee assignment
        let employeeToAssign = employeeId;
        // If we need to create a new employee
        if (createNewEmployee === "true" && newEmployeeName && newEmployeeEmail) {
            try {
                // Reuse the generateEmployeeId function
                const generateEmployeeId = () => __awaiter(void 0, void 0, void 0, function* () {
                    const lastEmployee = yield prisma.employee.findFirst({
                        orderBy: {
                            employeeId: "desc",
                        },
                    });
                    const lastNumber = lastEmployee
                        ? parseInt(lastEmployee.employeeId.replace("EM00", ""), 10)
                        : 0;
                    const nextNumber = lastNumber + 1;
                    return `EM00${nextNumber.toString().padStart(4, "0")}`;
                });
                const newEmployeeId = yield generateEmployeeId();
                // Create the new employee
                const newEmployee = yield prisma.employee.create({
                    data: {
                        employeeId: newEmployeeId,
                        nom: newEmployeeName,
                        email: newEmployeeEmail,
                    },
                });
                // Use the new employee's ID for assignment
                employeeToAssign = newEmployee.employeeId;
            }
            catch (employeeError) {
                console.error("Error creating new employee:", employeeError);
                res.status(400).json({
                    message: "Error creating new employee",
                    details: employeeError instanceof Error
                        ? employeeError.message
                        : "Unknown error",
                });
                return;
            }
        }
        // If we have an employee to assign
        if (employeeToAssign) {
            // Verify the employee exists
            const employee = yield prisma.employee.findUnique({
                where: { employeeId: employeeToAssign },
            });
            if (!employee) {
                res.status(400).json({ message: "Invalid employeeId" });
                return;
            }
            // Create the relationship between employee and license with the specified quantity
            yield prisma.employeeLicense.create({
                data: {
                    employeeId: employeeToAssign,
                    licenseId: newLicense.licenseId,
                    assignedAt: new Date(),
                    quantity: parsedAssignQuantity,
                },
            });
            // Update the assignedTo field in the license
            yield prisma.license.update({
                where: { licenseId: newLicense.licenseId },
                data: { assignedTo: employee.nom },
            });
        }
        // Fetch the complete license with relations
        const completeLicense = yield prisma.license.findUnique({
            where: { licenseId: newLicense.licenseId },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                attachments: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the employee data for frontend
        const transformedLicense = Object.assign(Object.assign({}, completeLicense), { employees: (completeLicense === null || completeLicense === void 0 ? void 0 : completeLicense.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt })))) || [] });
        res.status(201).json(transformedLicense);
    }
    catch (error) {
        console.error("Error creating license:", error);
        res.status(500).json({
            message: "Error creating license",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createLicense = createLicense;
/**
 * Update a License by ID with file upload support
 */
const updateLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { softwareName, version, licenseType, licenseQuantity, startDate, expiryDate, assignedTo, licenseTypeId, statusId, etatId, employeeIds, employeeQuantities, licenseKey, vendorName, vendorContact, supportContact, deletedAttachmentIds, } = req.body;
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Validate status if provided
        if (statusId) {
            const status = yield prisma.status.findUnique({
                where: { statusId },
            });
            if (!status) {
                res.status(400).json({ message: "Invalid status ID" });
                return;
            }
        }
        // Validate etat if provided
        if (etatId) {
            const etat = yield prisma.etat.findUnique({
                where: { etatId },
            });
            if (!etat) {
                res.status(400).json({ message: "Invalid etat ID" });
                return;
            }
        }
        // Parse and validate quantity if provided
        let parsedLicenseQuantity;
        if (licenseQuantity !== undefined) {
            parsedLicenseQuantity = parseInt(licenseQuantity, 10);
            if (isNaN(parsedLicenseQuantity) || parsedLicenseQuantity <= 0) {
                res.status(400).json({ message: "Invalid license quantity value" });
                return;
            }
        }
        // Parse dates if provided
        let parsedStartDate;
        let parsedExpiryDate;
        if (startDate !== undefined) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                res.status(400).json({ message: "Invalid start date format" });
                return;
            }
        }
        if (expiryDate !== undefined) {
            parsedExpiryDate = new Date(expiryDate);
            if (isNaN(parsedExpiryDate.getTime())) {
                res.status(400).json({ message: "Invalid expiry date format" });
                return;
            }
        }
        // Check if expiry date is after start date
        if (parsedStartDate &&
            parsedExpiryDate &&
            parsedExpiryDate <= parsedStartDate) {
            res.status(400).json({ message: "Expiry date must be after start date" });
            return;
        }
        else if (parsedStartDate &&
            !parsedExpiryDate &&
            license.expiryDate <= parsedStartDate) {
            res.status(400).json({ message: "Expiry date must be after start date" });
            return;
        }
        else if (!parsedStartDate &&
            parsedExpiryDate &&
            parsedExpiryDate <= license.startDate) {
            res.status(400).json({ message: "Expiry date must be after start date" });
            return;
        }
        // Validate licenseTypeId if provided
        if (licenseTypeId) {
            const licenseTypeObj = yield prisma.licenseType.findUnique({
                where: { licenseTypeId },
            });
            if (!licenseTypeObj) {
                res.status(400).json({ message: "Invalid license type ID" });
                return;
            }
        }
        // Start a transaction to handle multiple operations
        const updatedLicense = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Update the license first
            const updated = yield prismaClient.license.update({
                where: { licenseId },
                data: {
                    softwareName: softwareName || license.softwareName,
                    version: version || license.version,
                    licenseType: licenseType || license.licenseType,
                    licenseQuantity: parsedLicenseQuantity || license.licenseQuantity,
                    startDate: parsedStartDate || license.startDate,
                    expiryDate: parsedExpiryDate || license.expiryDate,
                    assignedTo: assignedTo !== undefined ? assignedTo : license.assignedTo,
                    licenseTypeId: licenseTypeId || license.licenseTypeId,
                    statusId: statusId || license.statusId,
                    etatId: etatId || license.etatId,
                    licenseKey: licenseKey !== undefined ? licenseKey : license.licenseKey,
                    vendorName: vendorName || license.vendorName,
                    vendorContact: vendorContact !== undefined ? vendorContact : license.vendorContact,
                    supportContact: supportContact !== undefined
                        ? supportContact
                        : license.supportContact,
                },
            });
            // Handle file uploads if files are present
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                for (const file of req.files) {
                    // Create a relative path for storage in DB
                    const relativePath = `/uploads/licenses/${file.filename}`;
                    // Create attachment record in database
                    yield prismaClient.licenseAttachment.create({
                        data: {
                            attachmentId: `LATT-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                            licenseId: license.licenseId,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileUrl: relativePath,
                        },
                    });
                }
            }
            // Handle attachment deletions if specified
            if (deletedAttachmentIds) {
                try {
                    const deletedIds = JSON.parse(deletedAttachmentIds);
                    if (Array.isArray(deletedIds) && deletedIds.length > 0) {
                        // Find attachments to get file paths before deletion
                        const attachmentsToDelete = yield prismaClient.licenseAttachment.findMany({
                            where: {
                                attachmentId: { in: deletedIds },
                                licenseId: licenseId,
                            },
                        });
                        // Delete from database
                        yield prismaClient.licenseAttachment.deleteMany({
                            where: {
                                attachmentId: { in: deletedIds },
                                licenseId: licenseId,
                            },
                        });
                        // Delete physical files
                        for (const attachment of attachmentsToDelete) {
                            // Get the full file path
                            const filePath = path_1.default.join(__dirname, "..", attachment.fileUrl);
                            // Delete file if it exists
                            if (fs_1.default.existsSync(filePath)) {
                                fs_1.default.unlinkSync(filePath);
                            }
                        }
                    }
                }
                catch (error) {
                    console.error("Error parsing deletedAttachmentIds:", error);
                }
            }
            // If employeeIds are provided, update employee relationships
            if (employeeIds && Array.isArray(employeeIds)) {
                // First, delete all existing relationships for this license
                yield prismaClient.employeeLicense.deleteMany({
                    where: { licenseId },
                });
                // Then, create new relationships for each provided employeeId with quantity
                for (let i = 0; i < employeeIds.length; i++) {
                    const empId = employeeIds[i];
                    // Get quantity for this employee, default to 1 if not specified
                    const empQuantity = employeeQuantities && employeeQuantities[empId]
                        ? parseInt(employeeQuantities[empId], 10)
                        : 1;
                    // Verify employee exists
                    const employee = yield prismaClient.employee.findUnique({
                        where: { employeeId: empId },
                    });
                    if (employee) {
                        yield prismaClient.employeeLicense.create({
                            data: {
                                employeeId: empId,
                                licenseId,
                                assignedAt: new Date(),
                                quantity: empQuantity,
                            },
                        });
                    }
                }
                // Update the assignedTo field based on the employee assignments
                if (employeeIds.length > 0) {
                    const firstEmployee = yield prismaClient.employee.findUnique({
                        where: { employeeId: employeeIds[0] },
                    });
                    if (firstEmployee) {
                        yield prismaClient.license.update({
                            where: { licenseId },
                            data: {
                                assignedTo: employeeIds.length === 1
                                    ? firstEmployee.nom
                                    : `${firstEmployee.nom} and ${employeeIds.length - 1} others`,
                            },
                        });
                    }
                }
                else {
                    // If no employees are assigned, clear the assignedTo field
                    yield prismaClient.license.update({
                        where: { licenseId },
                        data: { assignedTo: null },
                    });
                }
            }
            // Return the updated license with fresh relations
            return yield prismaClient.license.findUnique({
                where: { licenseId },
                include: {
                    licensetype: true,
                    status: true,
                    etat: true,
                    attachments: true,
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                },
            });
        }));
        res.status(200).json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license:", error);
        res.status(500).json({
            message: "Error updating license",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateLicense = updateLicense;
/**
 * Delete a License by ID
 */
const deleteLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const license = yield prisma.license.findUnique({
            where: { licenseId },
            include: {
                attachments: true,
                hashtags: true,
            },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Start a transaction to handle deletion of related records
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete physical attachment files first
            for (const attachment of license.attachments) {
                const filePath = path_1.default.join(__dirname, "..", attachment.fileUrl);
                // Delete file if it exists
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            yield prismaClient.licenseHashtag.deleteMany({
                where: { licenseId },
            });
            // Delete all attachments from database
            yield prismaClient.licenseAttachment.deleteMany({
                where: { licenseId },
            });
            // Delete associated employee-license relationships
            yield prismaClient.employeeLicense.deleteMany({
                where: { licenseId },
            });
            // Finally delete the license
            yield prismaClient.license.delete({
                where: { licenseId },
            });
        }));
        res.status(200).json({ message: "License deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting license:", error);
        res.status(500).json({
            message: "Error deleting license",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteLicense = deleteLicense;
/**
 * Assign licenses to an employee
 */
const assignLicensesToEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get the selected database
        const selectedDatabase = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) || "insight";
        console.log(`Using database: ${selectedDatabase}`);
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { licenseIds, quantities } = req.body;
        if (!employeeId ||
            !licenseIds ||
            !Array.isArray(licenseIds) ||
            licenseIds.length === 0) {
            res
                .status(400)
                .json({ message: "Employee ID and license IDs are required" });
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
        // Execute in transaction for data consistency
        const results = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            const assignments = [];
            // Process each license
            for (let i = 0; i < licenseIds.length; i++) {
                const licenseId = licenseIds[i];
                // Get quantity for this license, default to 1 if not specified
                const quantity = quantities && quantities[licenseId]
                    ? parseInt(quantities[licenseId], 10)
                    : 1;
                // Check if license exists
                const license = yield prismaClient.license.findUnique({
                    where: { licenseId },
                });
                if (!license) {
                    console.log(`License not found: ${licenseId}, skipping`);
                    continue; // Skip if license doesn't exist
                }
                // Check if a relationship already exists
                const existingRelation = yield prismaClient.employeeLicense.findUnique({
                    where: {
                        employeeId_licenseId: {
                            employeeId,
                            licenseId,
                        },
                    },
                });
                if (existingRelation) {
                    console.log(`Updating existing relation for license: ${licenseId}`);
                    // Update the existing relationship with new quantity
                    yield prismaClient.employeeLicense.update({
                        where: {
                            employeeId_licenseId: {
                                employeeId,
                                licenseId,
                            },
                        },
                        data: {
                            quantity: existingRelation.quantity + quantity,
                            assignedAt: new Date(), // Update the assignment date
                        },
                    });
                }
                else {
                    console.log(`Creating new relation for license: ${licenseId}`);
                    // Create a new relationship
                    yield prismaClient.employeeLicense.create({
                        data: {
                            employeeId,
                            licenseId,
                            quantity,
                            assignedAt: new Date(),
                        },
                    });
                }
                // Update the status of the license to "Réservé"
                const reservedStatus = yield prismaClient.status.findFirst({
                    where: { name: "Réservé" },
                });
                if (reservedStatus) {
                    console.log(`Updating license status to "Réservé" (${reservedStatus.statusId})`);
                    yield prismaClient.license.update({
                        where: { licenseId },
                        data: { statusId: reservedStatus.statusId },
                    });
                }
                else {
                    console.warn('Status "Réservé" not found in the database');
                }
                // Add to assignments for the result
                assignments.push(licenseId);
            }
            return assignments;
        }));
        console.log(`Successfully assigned ${results.length} licenses`);
        // Get complete license information for the email
        const assignedLicenses = yield prisma.license.findMany({
            where: { licenseId: { in: results } },
        });
        // Generate token for email acceptance - PASS THE DATABASE NAME
        const token = (0, tokenService_1.generateLicenseAssignmentToken)(employeeId, results, quantities, selectedDatabase);
        // Calculate expiry date (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        console.log(`Storing license assignment token with database: ${selectedDatabase}`);
        // Store the token in database - PASS THE DATABASE NAME 
        yield (0, tokenService_1.storeAssignmentToken)(token, employeeId, results, expiryDate, "license", selectedDatabase);
        // Send email notification to employee
        console.log("Sending email notification to employee");
        const emailSent = yield (0, emailServices_1.sendLicenseAssignmentNotification)(employee, assignedLicenses, token);
        // Get the updated employee with all assigned licenses
        const updatedEmployee = yield prisma.employee.findUnique({
            where: { employeeId },
            include: {
                licenses: {
                    include: {
                        license: {
                            include: {
                                licensetype: true,
                                status: true,
                                etat: true,
                            },
                        },
                    },
                },
            },
        });
        console.log(`License assignment process completed. Email sent: ${emailSent}`);
        res.status(200).json({
            message: emailSent
                ? "Licences réservées avec succès et notification envoyée à l'employé"
                : "Licences réservées avec succès mais échec de l'envoi de la notification par email",
            assignedLicenses: results,
            employee: updatedEmployee,
            emailSent,
        });
    }
    catch (error) {
        console.error("Error assigning licenses:", error);
        // Enhanced error logging
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        res.status(500).json({
            message: "Error assigning licenses",
            details: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === "development"
                ? error instanceof Error
                    ? error.stack
                    : undefined
                : undefined,
        });
    }
});
exports.assignLicensesToEmployee = assignLicensesToEmployee;
/**
 * Remove licenses from an employee
 */
const removeLicensesFromEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { licenseIds, quantities, reason } = req.body;
        if (!employeeId ||
            !licenseIds ||
            !Array.isArray(licenseIds) ||
            licenseIds.length === 0) {
            res
                .status(400)
                .json({ message: "Employee ID and license IDs are required" });
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
        const results = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const removals = [];
            // Process each license
            for (let i = 0; i < licenseIds.length; i++) {
                const licenseId = licenseIds[i];
                // Get quantity to remove for this license, default to all if not specified
                const quantityToRemove = quantities && quantities[licenseId]
                    ? parseInt(quantities[licenseId], 10)
                    : null; // null means remove all
                // Check if a relationship exists
                const existingRelation = yield prismaClient.employeeLicense.findUnique({
                    where: {
                        employeeId_licenseId: {
                            employeeId,
                            licenseId,
                        },
                    },
                });
                if (!existingRelation) {
                    continue; // Skip if relationship doesn't exist
                }
                // Get license to check its status
                const license = yield prismaClient.license.findUnique({
                    where: { licenseId },
                    include: { status: true },
                });
                const isReserved = ((_a = license === null || license === void 0 ? void 0 : license.status) === null || _a === void 0 ? void 0 : _a.name) === "Réservé";
                if (quantityToRemove === null ||
                    quantityToRemove >= existingRelation.quantity) {
                    // Remove the entire relationship
                    yield prismaClient.employeeLicense.delete({
                        where: {
                            employeeId_licenseId: {
                                employeeId,
                                licenseId,
                            },
                        },
                    });
                    // Check if this license is no longer assigned to any employee
                    const otherAssignments = yield prismaClient.employeeLicense.findFirst({
                        where: { licenseId },
                    });
                    if (!otherAssignments) {
                        // Find a "Disponible" status or similar
                        const availableStatus = yield prismaClient.status.findFirst({
                            where: { name: "Disponible" },
                        });
                        if (availableStatus) {
                            // Update the license status to "Disponible"
                            yield prismaClient.license.update({
                                where: { licenseId },
                                data: { statusId: availableStatus.statusId },
                            });
                        }
                    }
                    // If this was a reserved license, cancel the assignment token
                    if (isReserved) {
                        // Find assignment tokens for this license
                        const pendingTokens = yield prismaClient.assignmentToken.findMany({
                            where: {
                                employeeId,
                                licenseIds: { has: licenseId },
                                status: "PENDING",
                                type: "license",
                            },
                        });
                        // Update tokens that only included this license
                        for (const token of pendingTokens) {
                            if (token.licenseIds.length === 1 &&
                                token.licenseIds[0] === licenseId) {
                                yield prismaClient.assignmentToken.update({
                                    where: { tokenId: token.tokenId },
                                    data: {
                                        status: "REJECTED",
                                        usedAt: new Date(),
                                    },
                                });
                            }
                            else {
                                // Token has multiple licenses, remove this one from the list
                                const updatedLicenseIds = token.licenseIds.filter((id) => id !== licenseId);
                                yield prismaClient.assignmentToken.update({
                                    where: { tokenId: token.tokenId },
                                    data: { licenseIds: updatedLicenseIds },
                                });
                            }
                        }
                    }
                }
                else {
                    // Update the quantity in the relationship
                    yield prismaClient.employeeLicense.update({
                        where: {
                            employeeId_licenseId: {
                                employeeId,
                                licenseId,
                            },
                        },
                        data: {
                            quantity: existingRelation.quantity - quantityToRemove,
                        },
                    });
                }
                // Create activity log entry
                const activityType = isReserved
                    ? "LICENSE_REJECTED"
                    : "LICENSE_REMOVED";
                const details = reason
                    ? `License ${isReserved ? "reservation cancelled" : "removed"}. Reason: ${reason}`
                    : `License ${isReserved ? "reservation cancelled" : "removed"}`;
                yield prismaClient.activityLog.create({
                    data: {
                        activityType,
                        employeeId,
                        licenseId,
                        details,
                        timestamp: new Date(),
                    },
                });
                removals.push(licenseId);
            }
            return removals;
        }));
        // Get the updated employee with remaining assigned licenses
        const updatedEmployee = yield prisma.employee.findUnique({
            where: { employeeId },
            include: {
                licenses: {
                    include: {
                        license: {
                            include: {
                                licensetype: true,
                                status: true,
                                etat: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            message: "Licenses removed successfully",
            removedLicenses: results,
            employee: updatedEmployee,
        });
    }
    catch (error) {
        console.error("Error removing licenses:", error);
        res.status(500).json({
            message: "Error removing licenses",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.removeLicensesFromEmployee = removeLicensesFromEmployee;
/**
 * Get all license assignments with quantities
 */
const getLicenseAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const assignments = yield prisma.employeeLicense.findMany({
            include: {
                employee: true,
                license: {
                    include: {
                        licensetype: true,
                        status: true,
                        etat: true,
                        attachments: true,
                    },
                },
            },
        });
        res.json(assignments);
    }
    catch (error) {
        console.error("Error retrieving license assignments:", error);
        res.status(500).json({ message: "Failed to retrieve license assignments" });
    }
});
exports.getLicenseAssignments = getLicenseAssignments;
/**
 * Get license by ID with all related information
 */
const getLicenseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const license = yield prisma.license.findUnique({
            where: { licenseId },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                attachments: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Transform the data to make it easier to work with in the frontend
        const transformedLicense = Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) });
        res.json(transformedLicense);
    }
    catch (error) {
        console.error("Error retrieving license:", error);
        res.status(500).json({
            message: "Failed to retrieve license",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicenseById = getLicenseById;
/**
 * Get license attachments
 */
const getLicenseAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Get all attachments for the license
        const attachments = yield prisma.licenseAttachment.findMany({
            where: { licenseId },
        });
        res.json(attachments);
    }
    catch (error) {
        console.error("Error retrieving attachments:", error);
        res.status(500).json({
            message: "Failed to retrieve attachments",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicenseAttachments = getLicenseAttachments;
/**
 * Update license expiry date
 */
const updateLicenseExpiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { expiryDate } = req.body;
        if (!expiryDate) {
            res.status(400).json({ message: "Expiry date is required" });
            return;
        }
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
            include: { status: true, etat: true },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Parse expiry date
        let parsedExpiryDate;
        try {
            parsedExpiryDate = new Date(expiryDate);
            if (isNaN(parsedExpiryDate.getTime())) {
                res.status(400).json({ message: "Invalid expiry date format" });
                return;
            }
            // Check if the new expiry date is after the start date
            if (parsedExpiryDate <= license.startDate) {
                res
                    .status(400)
                    .json({ message: "Expiry date must be after start date" });
                return;
            }
        }
        catch (error) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        // Update the license expiry date
        const updatedLicense = yield prisma.license.update({
            where: { licenseId },
            data: {
                expiryDate: parsedExpiryDate,
            },
            include: { status: true, etat: true },
        });
        res.status(200).json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license expiry:", error);
        res.status(500).json({
            message: "Failed to update license expiry",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateLicenseExpiry = updateLicenseExpiry;
/**
 * Get licenses by type
 */
const getLicensesByType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseTypeId } = req.params;
        // Verify the license type exists
        const licenseType = yield prisma.licenseType.findUnique({
            where: { licenseTypeId },
        });
        if (!licenseType) {
            res.status(404).json({ message: "License type not found" });
            return;
        }
        // Get all licenses with the specified license type
        const licenses = yield prisma.license.findMany({
            where: { licenseTypeId },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedLicenses = licenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving licenses by type:", error);
        res.status(500).json({
            message: "Failed to retrieve licenses by type",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicensesByType = getLicensesByType;
/**
 * Get licenses by etat
 */
const getLicensesByEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { etatId } = req.params;
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Get all licenses with the specified etat
        const licenses = yield prisma.license.findMany({
            where: { etatId },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedLicenses = licenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving licenses by etat:", error);
        res.status(500).json({
            message: "Failed to retrieve licenses by etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicensesByEtat = getLicensesByEtat;
/**
 * Get expiring licenses (within next 30 days by default)
 */
const getExpiringLicenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Get days parameter, default to 30 if not provided
        const days = req.query.days ? parseInt(req.query.days.toString(), 10) : 30;
        if (isNaN(days) || days <= 0) {
            res.status(400).json({ message: "Invalid days parameter" });
            return;
        }
        // Calculate the date range
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        // Get licenses that expire within the specified range
        const expiringLicenses = yield prisma.license.findMany({
            where: {
                expiryDate: {
                    gte: today,
                    lte: futureDate,
                },
            },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
            orderBy: {
                expiryDate: "asc", // Sort by expiry date, soonest first
            },
        });
        // Transform the data
        const transformedLicenses = expiringLicenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))), daysUntilExpiry: Math.ceil((license.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving expiring licenses:", error);
        res.status(500).json({
            message: "Failed to retrieve expiring licenses",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getExpiringLicenses = getExpiringLicenses;
/**
 * Get expired licenses
 */
const getExpiredLicenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const today = new Date();
        // Get licenses that have already expired
        const expiredLicenses = yield prisma.license.findMany({
            where: {
                expiryDate: {
                    lt: today,
                },
            },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
            orderBy: {
                expiryDate: "desc", // Sort by expiry date, most recently expired first
            },
        });
        // Transform the data
        const transformedLicenses = expiredLicenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))), daysExpired: Math.ceil((today.getTime() - license.expiryDate.getTime()) / (1000 * 60 * 60 * 24)) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving expired licenses:", error);
        res.status(500).json({
            message: "Failed to retrieve expired licenses",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getExpiredLicenses = getExpiredLicenses;
/**
 * Renew license with file upload support
 */
const renewLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { expiryDate, licenseQuantity, statusId, etatId, licenseKey, vendorName, vendorContact, supportContact, } = req.body;
        if (!expiryDate) {
            res.status(400).json({ message: "New expiry date is required" });
            return;
        }
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Validate status if provided
        if (statusId) {
            const status = yield prisma.status.findUnique({
                where: { statusId },
            });
            if (!status) {
                res.status(400).json({ message: "Invalid status ID" });
                return;
            }
        }
        // Validate etat if provided
        if (etatId) {
            const etat = yield prisma.etat.findUnique({
                where: { etatId },
            });
            if (!etat) {
                res.status(400).json({ message: "Invalid etat ID" });
                return;
            }
        }
        // Parse the new expiry date
        let parsedExpiryDate;
        try {
            parsedExpiryDate = new Date(expiryDate);
            if (isNaN(parsedExpiryDate.getTime())) {
                res.status(400).json({ message: "Invalid expiry date format" });
                return;
            }
            // Check if the new expiry date is after the start date
            if (parsedExpiryDate <= license.startDate) {
                res
                    .status(400)
                    .json({ message: "Expiry date must be after start date" });
                return;
            }
            // Check if the new expiry date is after the current expiry date
            if (parsedExpiryDate <= license.expiryDate) {
                res.status(400).json({
                    message: "New expiry date must be after current expiry date",
                });
                return;
            }
        }
        catch (error) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        // Parse license quantity if provided
        let parsedLicenseQuantity;
        if (licenseQuantity !== undefined) {
            parsedLicenseQuantity = parseInt(licenseQuantity, 10);
            if (isNaN(parsedLicenseQuantity) || parsedLicenseQuantity <= 0) {
                res.status(400).json({ message: "Invalid license quantity value" });
                return;
            }
        }
        // Start a transaction to handle multiple operations
        const renewedLicense = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Update the license with new fields
            const updated = yield prismaClient.license.update({
                where: { licenseId },
                data: {
                    expiryDate: parsedExpiryDate,
                    licenseQuantity: parsedLicenseQuantity || license.licenseQuantity,
                    statusId: statusId || license.statusId,
                    etatId: etatId || license.etatId,
                    licenseKey: licenseKey !== undefined ? licenseKey : license.licenseKey,
                    vendorName: vendorName || license.vendorName,
                    vendorContact: vendorContact !== undefined ? vendorContact : license.vendorContact,
                    supportContact: supportContact !== undefined
                        ? supportContact
                        : license.supportContact,
                },
            });
            // Handle file uploads if files are present
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                for (const file of req.files) {
                    // Create a relative path for storage in DB
                    const relativePath = `/uploads/licenses/${file.filename}`;
                    // Create attachment record in database
                    yield prismaClient.licenseAttachment.create({
                        data: {
                            attachmentId: `LATT-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                            licenseId,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileUrl: relativePath,
                        },
                    });
                }
            }
            // Return the updated license with fresh relations
            return yield prismaClient.license.findUnique({
                where: { licenseId },
                include: {
                    licensetype: true,
                    status: true,
                    etat: true,
                    attachments: true,
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                },
            });
        }));
        // Transform the employee data for frontend
        const transformedLicense = Object.assign(Object.assign({}, renewedLicense), { employees: (renewedLicense === null || renewedLicense === void 0 ? void 0 : renewedLicense.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt })))) || [] });
        res.status(200).json(transformedLicense);
    }
    catch (error) {
        console.error("Error renewing license:", error);
        res.status(500).json({
            message: "Error renewing license",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.renewLicense = renewLicense;
/**
 * Get license usage statistics
 */
const getLicenseUsageStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Get all licenses with their employee assignments, status, and etat
        const licenses = yield prisma.license.findMany({
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: true,
            },
        });
        // Calculate usage statistics for each license
        const licenseStats = licenses.map((license) => {
            // Calculate total assigned quantity
            const totalAssigned = license.employees.reduce((sum, assignment) => sum + assignment.quantity, 0);
            // Calculate available licenses
            const available = Math.max(0, license.licenseQuantity - totalAssigned);
            // Calculate usage percentage
            const usagePercentage = license.licenseQuantity > 0
                ? Math.round((totalAssigned / license.licenseQuantity) * 100)
                : 0;
            return {
                licenseId: license.licenseId,
                softwareName: license.softwareName,
                version: license.version,
                licenseType: license.licenseType,
                licenseTypeName: license.licensetype.nom,
                statusId: license.statusId,
                statusName: license.status.name,
                etatId: license.etatId,
                etatName: license.etat.name,
                licenseKey: license.licenseKey,
                vendorName: license.vendorName,
                vendorContact: license.vendorContact,
                supportContact: license.supportContact,
                totalLicenses: license.licenseQuantity,
                assignedLicenses: totalAssigned,
                availableLicenses: available,
                usagePercentage: usagePercentage,
                expiryDate: license.expiryDate,
                daysUntilExpiry: Math.ceil((license.expiryDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)),
                isExpired: license.expiryDate < new Date(),
            };
        });
        res.json(licenseStats);
    }
    catch (error) {
        console.error("Error retrieving license usage statistics:", error);
        res.status(500).json({
            message: "Failed to retrieve license usage statistics",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicenseUsageStats = getLicenseUsageStats;
/**
 * Get licenses by software name
 */
const getLicensesBySoftware = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { softwareName } = req.params;
        // Get all licenses matching the software name
        const licenses = yield prisma.license.findMany({
            where: {
                softwareName: {
                    contains: softwareName,
                    mode: "insensitive", // Case-insensitive search
                },
            },
            include: {
                licensetype: true,
                status: true,
                etat: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data
        const transformedLicenses = licenses.map((license) => (Object.assign(Object.assign({}, license), { employees: license.employees.map((el) => (Object.assign(Object.assign({}, el.employee), { quantity: el.quantity, assignedAt: el.assignedAt }))) })));
        res.json(transformedLicenses);
    }
    catch (error) {
        console.error("Error retrieving licenses by software name:", error);
        res.status(500).json({
            message: "Failed to retrieve licenses by software name",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getLicensesBySoftware = getLicensesBySoftware;
/**
 * Update license etat
 */
const updateLicenseEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { licenseId } = req.params;
        const { etatId } = req.body;
        if (!etatId) {
            res.status(400).json({ message: "Etat ID is required" });
            return;
        }
        // Verify the license exists
        const license = yield prisma.license.findUnique({
            where: { licenseId },
        });
        if (!license) {
            res.status(404).json({ message: "License not found" });
            return;
        }
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(400).json({ message: "Invalid etat ID" });
            return;
        }
        // Update the license etat
        const updatedLicense = yield prisma.license.update({
            where: { licenseId },
            data: {
                etatId,
            },
            include: {
                licensetype: true,
                status: true,
                etat: true,
            },
        });
        res.status(200).json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license etat:", error);
        res.status(500).json({
            message: "Failed to update license etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateLicenseEtat = updateLicenseEtat;
