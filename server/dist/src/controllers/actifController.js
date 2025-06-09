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
exports.updateSupplierInfo = exports.updateActifQuantity = exports.getExpiringActifs = exports.updateActifEtat = exports.updateActifStatus = exports.getActifBySerialNumber = exports.getActifsByEtat = exports.getActifsByActifType = exports.getActifsByStatus = exports.updateActifWarranty = exports.getActifAttachments = exports.getSpecificationByActifId = exports.getActifById = exports.getActifAssignments = exports.removeActifsFromEmployee = exports.assignActifsToEmployee = exports.deleteActif = exports.updateActif = exports.createActif = exports.getActifs = exports.upload = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auto_tagMidlleware_1 = require("../middleware/auto-tagMidlleware");
const tokenService_1 = require("../services/tokenService");
const emailServices_1 = require("../services/emailServices");
// Create both clients at startup with middleware applied
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
// Set up multer storage configuration
// Simple storage configuration for debugging
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(process.cwd(), "uploads/actifs");
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
// Configure multer upload - SINGLE DECLARATION
exports.upload = (0, multer_1.default)({
    storage: storage,
});
const generateEmployeeId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = getPrismaClient(req);
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
/**
 * Get all Actifs or search by name - UPDATED VERSION
 */
const getActifs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = getPrismaClient(req);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString();
        const actifs = yield prisma.actif.findMany({
            where: search
                ? {
                    OR: [
                        {
                            serialNumber: {
                                contains: search,
                            },
                        },
                        {
                            actifType: {
                                contains: search,
                            },
                        },
                        {
                            serialNumber: {
                                contains: search,
                            },
                        },
                        { marque: { name: { contains: search, mode: "insensitive" } } },
                        { modele: { name: { contains: search, mode: "insensitive" } } },
                        {
                            fournisseurs: {
                                some: {
                                    fournisseur: {
                                        name: { contains: search, mode: "insensitive" },
                                    },
                                },
                            },
                        },
                    ],
                }
                : undefined,
            include: {
                actiftype: {
                    include: {
                        category: true,
                    },
                },
                status: true,
                etat: true,
                specification: true,
                attachments: true,
                marque: true,
                modele: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                        status: true, // Include assignment-level status
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { marqueObj: actif.marque, modeleObj: actif.modele, employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt, assignmentStatus: ea.status, assignmentStatusId: ea.statusId }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs:", error);
        res.status(500).json({ message: "Failed to retrieve actifs" });
    }
});
exports.getActifs = getActifs;
/**
 * Create a new Actif with support for multiple suppliers
 */
const createActif = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const prisma = getPrismaClient(req);
        console.log("Using database:", ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) || "undefined");
        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);
        // Extract values directly from req.body
        const actifType = req.body.actifType;
        const serialNumber = req.body.serialNumber;
        const actifTypeId = req.body.actifTypeId;
        const statusId = req.body.statusId;
        const etatId = req.body.etatId; // Extract etatId
        const warrantyEnd = req.body.warrantyEnd;
        const quantity = req.body.quantity;
        const employeeId = req.body.employeeId;
        const specificationStr = req.body.specification;
        const createNewEmployee = req.body.createNewEmployee;
        const newEmployeeName = req.body.newEmployeeName;
        const newEmployeeEmail = req.body.newEmployeeEmail;
        const assignQuantity = req.body.assignQuantity;
        const marqueId = req.body.marqueId;
        const modeleId = req.body.modeleId;
        // Check for multi-supplier mode
        const useMultipleSuppliers = req.body.useMultipleSuppliers === "true";
        let supplierAllocations = [];
        let fournisseurId = req.body.fournisseurId;
        if (useMultipleSuppliers && req.body.supplierAllocations) {
            try {
                supplierAllocations = JSON.parse(req.body.supplierAllocations);
            }
            catch (e) {
                console.error("Error parsing supplier allocations JSON:", e);
                res
                    .status(400)
                    .json({ message: "Invalid supplier allocations format" });
                return;
            }
        }
        // Validate required fields
        if (!serialNumber ||
            !actifType ||
            !marqueId ||
            !modeleId ||
            !actifTypeId ||
            !statusId ||
            !etatId) {
            res.status(400).json({ message: "Required fields are missing" });
            return;
        }
        // Validate supplier information
        if (!useMultipleSuppliers && !fournisseurId) {
            res.status(400).json({ message: "Fournisseur is required" });
            return;
        }
        if (useMultipleSuppliers &&
            (!supplierAllocations || supplierAllocations.length === 0)) {
            res.status(400).json({
                message: "Supplier allocations are required for multi-supplier mode",
            });
            return;
        }
        // Parse and validate quantity
        const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;
        if (isNaN(parsedQuantity)) {
            res.status(400).json({ message: "Invalid quantity value" });
            return;
        }
        // If using multiple suppliers, validate that the total quantity matches
        if (useMultipleSuppliers) {
            const totalAllocated = supplierAllocations.reduce((sum, allocation) => sum + parseInt(allocation.quantity || 0, 10), 0);
            if (totalAllocated !== parsedQuantity) {
                res.status(400).json({
                    message: `Total allocated quantity (${totalAllocated}) does not match actif quantity (${parsedQuantity})`,
                });
                return;
            }
            // Check that all supplier IDs exist
            for (const allocation of supplierAllocations) {
                if (!allocation.fournisseurId) {
                    res.status(400).json({ message: "All suppliers must be selected" });
                    return;
                }
                const supplierExists = yield prisma.fournisseur.findUnique({
                    where: { fournisseurId: allocation.fournisseurId },
                });
                if (!supplierExists) {
                    res.status(400).json({
                        message: `Invalid supplier ID: ${allocation.fournisseurId}`,
                    });
                    return;
                }
            }
        }
        // Get the quantity to assign (defaults to 1)
        const parsedAssignQuantity = assignQuantity
            ? parseInt(assignQuantity, 10)
            : 1;
        // Parse warranty end date if provided
        let parsedWarrantyEnd = null;
        if (warrantyEnd) {
            parsedWarrantyEnd = new Date(warrantyEnd);
            if (isNaN(parsedWarrantyEnd.getTime())) {
                res.status(400).json({ message: "Invalid warranty end date" });
                return;
            }
        }
        // Validate actifTypeId
        if (!actifTypeId) {
            res.status(400).json({ message: "Invalid actif type ID format" });
            return;
        }
        const actifTypeObj = yield prisma.actifType.findUnique({
            where: { actifTypeId },
        });
        if (!actifTypeObj) {
            res.status(400).json({ message: "Invalid actif type ID" });
            return;
        }
        // Validate statusId
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(400).json({ message: "Invalid status ID" });
            return;
        }
        const etat = yield prisma.etat.findUnique({
            where: { etatId: Array.isArray(etatId) ? etatId[0] : etatId },
        });
        if (!etat) {
            res.status(400).json({ message: "Invalid etat ID" });
            return;
        }
        // Validate modeleId if provided
        if (modeleId) {
            const modeleObj = yield prisma.modele.findUnique({
                where: { modeleId },
            });
            if (!modeleObj) {
                res.status(400).json({ message: "Invalid modele ID" });
                return;
            }
        }
        // Validate fournisseurId if single supplier mode
        if (!useMultipleSuppliers && fournisseurId) {
            const fournisseurObj = yield prisma.fournisseur.findUnique({
                where: { fournisseurId },
            });
            if (!fournisseurObj) {
                res.status(400).json({ message: "Invalid fournisseur ID" });
                return;
            }
        }
        // Check if serial number is unique
        const existingActifWithSerial = yield prisma.actif.findUnique({
            where: { serialNumber },
        });
        if (existingActifWithSerial) {
            res.status(400).json({ message: "Serial number already exists" });
            return;
        }
        // Parse specification if provided
        let specification = null;
        if (specificationStr) {
            try {
                specification = JSON.parse(specificationStr);
            }
            catch (e) {
                console.error("Error parsing specification JSON:", e);
                res.status(400).json({ message: "Invalid specification format" });
                return;
            }
        }
        // Generate actifId
        const actifId = `${actifTypeObj.nom
            .substring(0, 2)
            .toUpperCase()}00${Math.floor(Math.random() * 10000)}`;
        // Start a transaction to handle multiple operations
        const newActif = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the new Actif
            const createdActif = yield prismaClient.actif.create({
                data: {
                    actifId,
                    serialNumber,
                    actifType,
                    dateAjout: new Date(),
                    actifTypeId,
                    statusId,
                    etatId: Array.isArray(etatId) ? etatId[0] : etatId,
                    warrantyEnd: parsedWarrantyEnd,
                    quantity: parsedQuantity,
                    marqueId,
                    modeleId,
                },
            });
            // Handle suppliers
            if (useMultipleSuppliers && supplierAllocations.length > 0) {
                // Multiple suppliers
                for (const allocation of supplierAllocations) {
                    yield prismaClient.actifFournisseur.create({
                        data: {
                            actifId: createdActif.actifId,
                            fournisseurId: allocation.fournisseurId,
                            quantity: parseInt(allocation.quantity, 10),
                            assignedAt: new Date(),
                        },
                    });
                }
            }
            else if (fournisseurId) {
                // Single supplier
                yield prismaClient.actifFournisseur.create({
                    data: {
                        actifId: createdActif.actifId,
                        fournisseurId: fournisseurId,
                        quantity: parsedQuantity,
                        assignedAt: new Date(),
                    },
                });
            }
            // Create specification if provided
            if (specification) {
                const { ram, cpu, stockage, graphique } = specification;
                yield prismaClient.specification.create({
                    data: {
                        specificationId: `SPEC-${actifId}`,
                        actifId: createdActif.actifId,
                        ram,
                        cpu,
                        stockage,
                        graphique,
                    },
                });
            }
            // Handle file uploads if files are present
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    // Create a relative path for storage in DB
                    const relativePath = `/uploads/actifs/${file.filename}`;
                    // Create attachment record in database
                    yield prismaClient.attachment.create({
                        data: {
                            attachmentId: `ATT-${Math.random().toString(36).substring(2, 9)}`,
                            actifId: createdActif.actifId,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileUrl: relativePath,
                        },
                    });
                }
            }
            return createdActif;
        }));
        // Handle employee assignment -----------------------------
        let employeeToAssign = employeeId;
        // If we need to create a new employee
        if (createNewEmployee === "true" && newEmployeeName && newEmployeeEmail) {
            try {
                const newEmployeeId = yield generateEmployeeId(req);
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
            // Extract the selected database for token creation
            const selectedDatabase = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.selectedDatabase) || "insight";
            // Verify the employee exists
            const employee = yield prisma.employee.findUnique({
                where: { employeeId: employeeToAssign },
            });
            if (!employee) {
                res.status(400).json({ message: "Invalid employeeId" });
                return;
            }
            // Find the "Réservé" status for assignments
            const reservedStatus = yield prisma.status.findFirst({
                where: { name: "Réservé" },
            });
            if (!reservedStatus) {
                res.status(400).json({ message: 'Status "Réservé" not found' });
                return;
            }
            // Create the relationship between employee and actif with "Réservé" status
            yield prisma.employeeActif.create({
                data: {
                    employeeId: employeeToAssign,
                    actifId: newActif.actifId,
                    assignedAt: new Date(),
                    quantity: parsedAssignQuantity,
                    statusId: reservedStatus.statusId, // Set assignment-level status to "Réservé"
                },
            });
            // Generate token for email acceptance
            const quantities = { [newActif.actifId]: parsedAssignQuantity };
            const token = (0, tokenService_1.generateAssignmentToken)(employeeToAssign, [newActif.actifId], quantities, selectedDatabase);
            // Calculate expiry date (7 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            console.log(`Storing assignment token with database: ${selectedDatabase}`);
            // Store the token in database
            yield (0, tokenService_1.storeAssignmentToken)(token, employeeToAssign, [newActif.actifId], expiryDate, "actif", selectedDatabase);
            // Send email notification to employee
            console.log("Sending email notification to employee for new actif assignment");
            try {
                const emailSent = yield (0, emailServices_1.sendAssignmentNotification)(employee, [newActif], // Pass the created actif
                token, selectedDatabase);
                if (!emailSent) {
                    console.warn("Failed to send assignment notification email");
                }
                else {
                    console.log(`Assignment notification email sent successfully to ${employee.email}`);
                }
            }
            catch (emailError) {
                console.error("Error sending assignment notification:", emailError);
                // Don't fail the actif creation if email fails
            }
        }
        // Fetch the complete actif with relations
        const completeActif = yield prisma.actif.findUnique({
            where: { actifId: newActif.actifId },
            include: {
                actiftype: true,
                status: true,
                etat: true,
                specification: true,
                attachments: true,
                employees: {
                    include: {
                        employee: true,
                    },
                },
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
            },
        });
        // Transform the data for the response
        const transformedActif = Object.assign(Object.assign({}, completeActif), { employees: (completeActif === null || completeActif === void 0 ? void 0 : completeActif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt })))) || [], suppliers: (completeActif === null || completeActif === void 0 ? void 0 : completeActif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            }))) || [] });
        res.status(201).json(transformedActif);
    }
    catch (error) {
        console.error("Error creating actif:", error);
        res.status(500).json({
            message: "Error creating actif",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createActif = createActif;
/**
 * Update an Actif by ID with file upload support
 */
const updateActif = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { actifType, serialNumber, marqueId, modeleId, actifTypeId, statusId, etatId, warrantyEnd, quantity, employeeIds, employeeQuantities, specifications, 
        // Supplier handling
        useMultipleSuppliers, supplierAllocations, fournisseurId, } = req.body;
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Check if serial number is already in use by another actif
        if (serialNumber && serialNumber !== actif.serialNumber) {
            const existingActifWithSerial = yield prisma.actif.findUnique({
                where: { serialNumber },
            });
            if (existingActifWithSerial &&
                existingActifWithSerial.actifId !== actifId) {
                res.status(400).json({ message: "Serial number already in use" });
                return;
            }
        }
        // Parse and validate quantity if provided
        let parsedQuantity;
        if (quantity !== undefined) {
            parsedQuantity = parseInt(quantity, 10);
            if (isNaN(parsedQuantity)) {
                res.status(400).json({ message: "Invalid quantity value" });
                return;
            }
        }
        // Parse warranty end date if provided
        let parsedWarrantyEnd;
        if (warrantyEnd !== undefined) {
            parsedWarrantyEnd = warrantyEnd ? new Date(warrantyEnd) : null;
            if (parsedWarrantyEnd instanceof Date &&
                !isNaN(parsedWarrantyEnd.getTime())) {
                // Valid date, continue processing...
            }
            else if (parsedWarrantyEnd !== null) {
                res.status(400).json({ message: "Invalid warranty end date format" });
                return;
            }
        }
        // Validate actifTypeId if provided
        if (actifTypeId) {
            const actifTypeObj = yield prisma.actifType.findUnique({
                where: { actifTypeId },
            });
            if (!actifTypeObj) {
                res.status(400).json({ message: "Invalid actifTypeId" });
                return;
            }
        }
        // Validate statusId if provided
        if (statusId) {
            const status = yield prisma.status.findUnique({
                where: { statusId },
            });
            if (!status) {
                res.status(400).json({ message: "Invalid statusId" });
                return;
            }
        }
        // Validate etatId if provided
        if (etatId) {
            const etat = yield prisma.etat.findUnique({
                where: { etatId: Array.isArray(etatId) ? etatId[0] : etatId },
            });
            if (!etat) {
                res.status(400).json({ message: "Invalid etatId" });
                return;
            }
        }
        // Validate marqueId if provided
        if (marqueId) {
            const marqueObj = yield prisma.marque.findUnique({
                where: { marqueId },
            });
            if (!marqueObj) {
                res.status(400).json({ message: "Invalid marqueId" });
                return;
            }
        }
        // Validate modeleId if provided
        if (modeleId) {
            const modeleObj = yield prisma.modele.findUnique({
                where: { modeleId },
            });
            if (!modeleObj) {
                res.status(400).json({ message: "Invalid modeleId" });
                return;
            }
        }
        // Parse supplier allocations if provided
        let parsedSupplierAllocations = [];
        if (useMultipleSuppliers === "true" && supplierAllocations) {
            try {
                parsedSupplierAllocations = JSON.parse(supplierAllocations);
                // Validate suppliers
                for (const allocation of parsedSupplierAllocations) {
                    if (!allocation.fournisseurId) {
                        res.status(400).json({ message: "All suppliers must be selected" });
                        return;
                    }
                    const supplierExists = yield prisma.fournisseur.findUnique({
                        where: { fournisseurId: allocation.fournisseurId },
                    });
                    if (!supplierExists) {
                        res.status(400).json({
                            message: `Invalid supplier ID: ${allocation.fournisseurId}`,
                        });
                        return;
                    }
                }
                // Validate total quantity
                if (parsedQuantity) {
                    const totalAllocated = parsedSupplierAllocations.reduce((sum, allocation) => sum + parseInt(allocation.quantity || 0, 10), 0);
                    if (totalAllocated !== parsedQuantity) {
                        res.status(400).json({
                            message: `Total allocated quantity (${totalAllocated}) does not match actif quantity (${parsedQuantity})`,
                        });
                        return;
                    }
                }
            }
            catch (e) {
                console.error("Error parsing supplier allocations JSON:", e);
                res
                    .status(400)
                    .json({ message: "Invalid supplier allocations format" });
                return;
            }
        }
        else if (fournisseurId) {
            // Validate fournisseurId if provided for single supplier mode
            const fournisseurObj = yield prisma.fournisseur.findUnique({
                where: { fournisseurId },
            });
            if (!fournisseurObj) {
                res.status(400).json({ message: "Invalid fournisseurId" });
                return;
            }
        }
        // Parse specifications if provided
        let specification = null;
        if (specifications) {
            try {
                specification = JSON.parse(specifications);
            }
            catch (e) {
                console.error("Error parsing specifications JSON:", e);
                res.status(400).json({ message: "Invalid specifications format" });
                return;
            }
        }
        // Start a transaction to handle multiple operations
        const updatedActif = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {};
            // Add basic fields if provided
            if (actifType)
                updateData.actifType = actifType;
            if (serialNumber)
                updateData.serialNumber = serialNumber;
            if (actifTypeId)
                updateData.actifTypeId = actifTypeId;
            if (statusId)
                updateData.statusId = statusId;
            if (etatId)
                updateData.etatId = Array.isArray(etatId) ? etatId[0] : etatId;
            if (parsedWarrantyEnd !== undefined)
                updateData.warrantyEnd = parsedWarrantyEnd;
            if (parsedQuantity !== undefined)
                updateData.quantity = parsedQuantity;
            // For marque/marqueId
            if (marqueId)
                updateData.marqueId = marqueId;
            // For modele/modeleId
            if (modeleId)
                updateData.modeleId = modeleId;
            // Update the actif with the prepared data
            const updated = yield prismaClient.actif.update({
                where: { actifId },
                data: updateData,
            });
            // Handle supplier updates
            if (useMultipleSuppliers === "true" &&
                parsedSupplierAllocations.length > 0) {
                // Delete current supplier relations
                yield prismaClient.actifFournisseur.deleteMany({
                    where: { actifId },
                });
                // Create new supplier relations
                for (const allocation of parsedSupplierAllocations) {
                    yield prismaClient.actifFournisseur.create({
                        data: {
                            actifId,
                            fournisseurId: allocation.fournisseurId,
                            quantity: parseInt(allocation.quantity, 10),
                            assignedAt: new Date(),
                        },
                    });
                }
            }
            else if (fournisseurId) {
                // Update to single supplier
                // First delete all existing supplier relations
                yield prismaClient.actifFournisseur.deleteMany({
                    where: { actifId },
                });
                // Create new single supplier relation
                yield prismaClient.actifFournisseur.create({
                    data: {
                        actifId,
                        fournisseurId,
                        quantity: parsedQuantity || actif.quantity,
                        assignedAt: new Date(),
                    },
                });
            }
            // Update specification if provided
            if (specification) {
                const existingSpec = yield prismaClient.specification.findUnique({
                    where: { actifId },
                });
                if (existingSpec) {
                    // Update existing specification
                    yield prismaClient.specification.update({
                        where: { actifId },
                        data: {
                            ram: specification.ram !== undefined
                                ? specification.ram
                                : existingSpec.ram,
                            cpu: specification.cpu !== undefined
                                ? specification.cpu
                                : existingSpec.cpu,
                            stockage: specification.stockage !== undefined
                                ? specification.stockage
                                : existingSpec.stockage,
                            graphique: specification.graphique !== undefined
                                ? specification.graphique
                                : existingSpec.graphique,
                        },
                    });
                }
                else {
                    // Create new specification
                    yield prismaClient.specification.create({
                        data: {
                            specificationId: `SPEC-${actifId}`,
                            actifId,
                            ram: specification.ram,
                            cpu: specification.cpu,
                            stockage: specification.stockage,
                            graphique: specification.graphique,
                        },
                    });
                }
            }
            // Handle file uploads if files are present
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                for (const file of req.files) {
                    // Create a relative path for storage in DB
                    const relativePath = `/uploads/actifs/${file.filename}`;
                    // Create attachment record in database
                    yield prismaClient.attachment.create({
                        data: {
                            attachmentId: `ATT-${Math.random().toString(36).substring(2, 9)}`,
                            actifId: actif.actifId,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileUrl: relativePath,
                        },
                    });
                }
            }
            // Handle attachment deletions if specified
            if (req.body.deletedAttachmentIds) {
                try {
                    const deletedIds = JSON.parse(req.body.deletedAttachmentIds);
                    if (Array.isArray(deletedIds) && deletedIds.length > 0) {
                        // Find attachments to get file paths before deletion
                        const attachmentsToDelete = yield prismaClient.attachment.findMany({
                            where: {
                                attachmentId: { in: deletedIds },
                                actifId: actifId,
                            },
                        });
                        // Delete from database
                        yield prismaClient.attachment.deleteMany({
                            where: {
                                attachmentId: { in: deletedIds },
                                actifId: actifId,
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
                // First, delete all existing relationships for this actif
                yield prismaClient.employeeActif.deleteMany({
                    where: { actifId },
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
                        yield prismaClient.employeeActif.create({
                            data: {
                                employeeId: empId,
                                actifId,
                                assignedAt: new Date(),
                                quantity: empQuantity,
                            },
                        });
                    }
                }
            }
            // Return the updated actif with fresh relations
            return yield prismaClient.actif.findUnique({
                where: { actifId },
                include: {
                    actiftype: true,
                    status: true,
                    etat: true,
                    specification: true,
                    attachments: true,
                    marque: true,
                    modele: true,
                    fournisseurs: {
                        include: {
                            fournisseur: true,
                        },
                    },
                    employees: {
                        include: {
                            employee: true,
                        },
                    },
                },
            });
        }));
        // Transform the response data
        const transformedActif = Object.assign(Object.assign({}, updatedActif), { employees: updatedActif === null || updatedActif === void 0 ? void 0 : updatedActif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: updatedActif === null || updatedActif === void 0 ? void 0 : updatedActif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) });
        res.status(200).json(transformedActif);
    }
    catch (error) {
        console.error("Error updating actif:", error);
        res.status(500).json({
            message: "Error updating actif",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActif = updateActif;
/**
 * Delete an Actif by ID
 */
const deleteActif = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
            include: {
                attachments: true,
                hashtags: true,
            },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Start a transaction to handle deletion of related records
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete specification if exists
            yield prismaClient.specification.deleteMany({
                where: { actifId },
            });
            yield prismaClient.actifHashtag.deleteMany({
                where: { actifId },
            });
            // Delete supplier-actif relations
            yield prismaClient.actifFournisseur.deleteMany({
                where: { actifId },
            });
            // Delete physical attachment files first
            for (const attachment of actif.attachments) {
                const filePath = path_1.default.join(__dirname, "..", attachment.fileUrl);
                // Delete file if it exists
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            // Delete all attachments from database
            yield prismaClient.attachment.deleteMany({
                where: { actifId },
            });
            // Delete associated employee-actif relationships
            yield prismaClient.employeeActif.deleteMany({
                where: { actifId },
            });
            // Finally delete the actif
            yield prismaClient.actif.delete({
                where: { actifId },
            });
        }));
        res.status(200).json({ message: "Actif deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting actif:", error);
        res.status(500).json({
            message: "Error deleting actif",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteActif = deleteActif;
/**
 * Assign actifs to an employee with quantities - UPDATED VERSION
 */
const assignActifsToEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("Selected database:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase);
        console.log("User object:", req.user);
        const prisma = getPrismaClient(req);
        // Extract the selected database for token creation
        const selectedDatabase = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.selectedDatabase) || "insight";
        const { employeeId } = req.params;
        const { actifIds, quantities } = req.body;
        if (!employeeId ||
            !actifIds ||
            !Array.isArray(actifIds) ||
            actifIds.length === 0) {
            res
                .status(400)
                .json({ message: "Employee ID and actif IDs are required" });
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
        // Find the "Réservé" status for assignments
        const reservedStatus = yield prisma.status.findFirst({
            where: { name: "Réservé" },
        });
        if (!reservedStatus) {
            res.status(400).json({ message: 'Status "Réservé" not found' });
            return;
        }
        // Execute in transaction for data consistency
        const results = yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            const assignments = [];
            // Process each actif
            for (let i = 0; i < actifIds.length; i++) {
                const actifId = actifIds[i];
                // Get quantity for this actif, default to 1 if not specified
                const quantity = quantities && quantities[actifId]
                    ? parseInt(quantities[actifId], 10)
                    : 1;
                // Check if actif exists
                const actif = yield prismaClient.actif.findUnique({
                    where: { actifId },
                });
                if (!actif) {
                    console.log(`Actif not found: ${actifId}, skipping`);
                    continue; // Skip if actif doesn't exist
                }
                // Check if a relationship already exists
                const existingRelation = yield prismaClient.employeeActif.findUnique({
                    where: {
                        employeeId_actifId: {
                            employeeId,
                            actifId,
                        },
                    },
                });
                if (existingRelation) {
                    console.log(`Updating existing relation for actif: ${actifId}`);
                    // Update the existing relationship with new quantity and status
                    yield prismaClient.employeeActif.update({
                        where: {
                            employeeId_actifId: {
                                employeeId,
                                actifId,
                            },
                        },
                        data: {
                            quantity: existingRelation.quantity + quantity,
                            assignedAt: new Date(), // Update the assignment date
                            statusId: reservedStatus.statusId, // Set assignment-level status
                        },
                    });
                }
                else {
                    console.log(`Creating new relation for actif: ${actifId}`);
                    // Create a new relationship with assignment-level status
                    yield prismaClient.employeeActif.create({
                        data: {
                            employeeId,
                            actifId,
                            quantity,
                            assignedAt: new Date(),
                            statusId: reservedStatus.statusId, // Set assignment-level status
                        },
                    });
                }
                // DON'T UPDATE GLOBAL ACTIF STATUS - This was the problem!
                // The global actif status should only be updated for actif-level changes
                // like "En panne", "En maintenance", etc.
                // Add to assignments for the result
                assignments.push(actifId);
            }
            return assignments;
        }));
        console.log(`Successfully assigned ${results.length} actifs`);
        // Get complete actif information for the email
        const assignedActifs = yield prisma.actif.findMany({
            where: { actifId: { in: results } },
        });
        // Generate token for email acceptance - PASS THE DATABASE NAME
        const token = (0, tokenService_1.generateAssignmentToken)(employeeId, results, quantities, selectedDatabase);
        // Calculate expiry date (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        console.log(`Storing assignment token with database: ${selectedDatabase}`);
        // Store the token in database - PASS THE DATABASE NAME
        yield (0, tokenService_1.storeAssignmentToken)(token, employeeId, results, expiryDate, "actif", selectedDatabase);
        // Send email notification to employee
        console.log("Sending email notification to employee");
        const emailSent = yield (0, emailServices_1.sendAssignmentNotification)(employee, assignedActifs, token, selectedDatabase);
        // Get the updated employee with all assigned actifs
        const updatedEmployee = yield prisma.employee.findUnique({
            where: { employeeId },
            include: {
                actifs: {
                    include: {
                        actif: {
                            include: {
                                actiftype: true,
                                status: true,
                                etat: true,
                                specification: true,
                            },
                        },
                        status: true, // Include assignment-level status
                    },
                },
            },
        });
        console.log(`Assignment process completed. Email sent: ${emailSent}`);
        res.status(200).json({
            message: emailSent
                ? "Actifs réservés avec succès et notification envoyée à l'employé"
                : "Actifs réservés avec succès mais échec de l'envoi de la notification par email",
            assignedActifs: results,
            employee: updatedEmployee,
            emailSent,
        });
    }
    catch (error) {
        console.error("Error assigning actifs:", error);
        // Enhanced error logging
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        res.status(500).json({
            message: "Error assigning actifs",
            details: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === "development"
                ? error instanceof Error
                    ? error.stack
                    : undefined
                : undefined,
        });
    }
});
exports.assignActifsToEmployee = assignActifsToEmployee;
/**
 * Remove actifs from an employee - UPDATED VERSION
 */
const removeActifsFromEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { employeeId } = req.params;
        const { actifIds, quantities, reason } = req.body;
        if (!employeeId ||
            !actifIds ||
            !Array.isArray(actifIds) ||
            actifIds.length === 0) {
            res
                .status(400)
                .json({ message: "Employee ID and actif IDs are required" });
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
            // Process each actif
            for (let i = 0; i < actifIds.length; i++) {
                const actifId = actifIds[i];
                // Get quantity to remove for this actif, default to all if not specified
                const quantityToRemove = quantities && quantities[actifId]
                    ? parseInt(quantities[actifId], 10)
                    : null; // null means remove all
                // Check if a relationship exists
                const existingRelation = yield prismaClient.employeeActif.findUnique({
                    where: {
                        employeeId_actifId: {
                            employeeId,
                            actifId,
                        },
                    },
                    include: {
                        status: true, // Include assignment-level status
                    },
                });
                if (!existingRelation) {
                    continue; // Skip if relationship doesn't exist
                }
                const isReserved = ((_a = existingRelation.status) === null || _a === void 0 ? void 0 : _a.name) === "Réservé";
                if (quantityToRemove === null ||
                    quantityToRemove >= existingRelation.quantity) {
                    // Remove the entire relationship
                    yield prismaClient.employeeActif.delete({
                        where: {
                            employeeId_actifId: {
                                employeeId,
                                actifId,
                            },
                        },
                    });
                    // If this was a reserved assignment, cancel the assignment token
                    if (isReserved) {
                        // Find assignment tokens for this actif
                        const pendingTokens = yield prismaClient.assignmentToken.findMany({
                            where: {
                                employeeId,
                                actifIds: { has: actifId },
                                status: "PENDING",
                            },
                        });
                        // Update tokens that only included this actif
                        for (const token of pendingTokens) {
                            if (token.actifIds.length === 1 &&
                                token.actifIds[0] === actifId) {
                                yield prismaClient.assignmentToken.update({
                                    where: { tokenId: token.tokenId },
                                    data: {
                                        status: "REJECTED",
                                        usedAt: new Date(),
                                    },
                                });
                            }
                            else {
                                // Token has multiple actifs, remove this one from the list
                                const updatedActifIds = token.actifIds.filter((id) => id !== actifId);
                                yield prismaClient.assignmentToken.update({
                                    where: { tokenId: token.tokenId },
                                    data: { actifIds: updatedActifIds },
                                });
                            }
                        }
                    }
                }
                else {
                    // Update the quantity in the relationship (keep the same status)
                    yield prismaClient.employeeActif.update({
                        where: {
                            employeeId_actifId: {
                                employeeId,
                                actifId,
                            },
                        },
                        data: {
                            quantity: existingRelation.quantity - quantityToRemove,
                        },
                    });
                }
                // Log removal reason if provided
                if (reason) {
                    console.log(`Actif ${actifId} removed from employee ${employeeId}. Reason: ${reason}`);
                    // Create activity log for the removal
                    yield prismaClient.activityLog.create({
                        data: {
                            activityType: "ACTIF_REMOVED",
                            employeeId,
                            actifId,
                            details: reason,
                            timestamp: new Date(),
                        },
                    });
                }
                removals.push(actifId);
            }
            return removals;
        }));
        // Get the updated employee with remaining assigned actifs
        const updatedEmployee = yield prisma.employee.findUnique({
            where: { employeeId },
            include: {
                actifs: {
                    include: {
                        actif: {
                            include: {
                                actiftype: true,
                                status: true,
                                etat: true,
                                specification: true,
                            },
                        },
                        status: true, // Include assignment-level status
                    },
                },
            },
        });
        res.status(200).json({
            message: "Actifs removed successfully",
            removedActifs: results,
            employee: updatedEmployee,
        });
    }
    catch (error) {
        console.error("Error removing actifs:", error);
        res.status(500).json({
            message: "Error removing actifs",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.removeActifsFromEmployee = removeActifsFromEmployee;
/**
 * Get all assignments with quantities - UPDATED VERSION
 */
const getActifAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const assignments = yield prisma.employeeActif.findMany({
            include: {
                employee: true,
                actif: {
                    include: {
                        actiftype: {
                            include: {
                                category: true,
                            },
                        },
                        status: true,
                        etat: true,
                        specification: true,
                        attachments: true,
                    },
                },
                status: true, // Include assignment-level status
            },
        });
        res.json(assignments);
    }
    catch (error) {
        console.error("Error retrieving actif assignments:", error);
        res.status(500).json({ message: "Failed to retrieve actif assignments" });
    }
});
exports.getActifAssignments = getActifAssignments;
/**
 * Get actif by ID with all related information
 */
const getActifById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
            include: {
                actiftype: true,
                status: true,
                etat: true,
                specification: true,
                attachments: true,
                marque: true,
                modele: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Transform the data to make it easier to work with in the frontend
        const transformedActif = Object.assign(Object.assign({}, actif), { employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) });
        res.json(transformedActif);
    }
    catch (error) {
        console.error("Error retrieving actif:", error);
        res.status(500).json({
            message: "Failed to retrieve actif",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifById = getActifById;
/**
 * Get specification by actif ID
 */
const getSpecificationByActifId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const specification = yield prisma.specification.findUnique({
            where: { actifId },
            include: {
                actif: true,
            },
        });
        if (!specification) {
            res
                .status(404)
                .json({ message: "Specification not found for this actif" });
            return;
        }
        res.json(specification);
    }
    catch (error) {
        console.error("Error retrieving specification:", error);
        res.status(500).json({
            message: "Failed to retrieve specification",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getSpecificationByActifId = getSpecificationByActifId;
/**
 * Get actif attachments
 */
const getActifAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Get all attachments for the actif
        const attachments = yield prisma.attachment.findMany({
            where: { actifId },
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
exports.getActifAttachments = getActifAttachments;
/**
 * Update actif warranty information
 */
const updateActifWarranty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { warrantyEnd } = req.body;
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Parse warranty end date if provided
        let parsedWarrantyEnd = null;
        if (warrantyEnd) {
            parsedWarrantyEnd = new Date(warrantyEnd);
            if (isNaN(parsedWarrantyEnd.getTime())) {
                res.status(400).json({ message: "Invalid warranty end date format" });
                return;
            }
        }
        // Update the actif warranty information
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                warrantyEnd: parsedWarrantyEnd,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif warranty:", error);
        res.status(500).json({
            message: "Failed to update actif warranty",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifWarranty = updateActifWarranty;
/**
 * Get actifs by status
 */
const getActifsByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { statusId } = req.params;
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Get all actifs with the specified status
        const actifs = yield prisma.actif.findMany({
            where: { statusId },
            include: {
                actiftype: {
                    include: {
                        category: true,
                    },
                },
                status: true,
                etat: true,
                marque: true,
                modele: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { marqueObj: actif.marque, modeleObj: actif.modele, employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs by status:", error);
        res.status(500).json({
            message: "Failed to retrieve actifs by status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifsByStatus = getActifsByStatus;
/**
 * Get actifs by actif type
 */
const getActifsByActifType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifTypeId } = req.params;
        // Verify the actif type exists
        const actifType = yield prisma.actifType.findUnique({
            where: { actifTypeId },
        });
        if (!actifType) {
            res.status(404).json({ message: "Actif type not found" });
            return;
        }
        // Get all actifs with the specified actif type
        const actifs = yield prisma.actif.findMany({
            where: { actifTypeId },
            include: {
                actiftype: {
                    include: {
                        category: true,
                    },
                },
                status: true,
                etat: true,
                marque: true,
                modele: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { marqueObj: actif.marque, modeleObj: actif.modele, employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs by actif type:", error);
        res.status(500).json({
            message: "Failed to retrieve actifs by actif type",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifsByActifType = getActifsByActifType;
/**
 * Get actifs by etat
 */
const getActifsByEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Get all actifs with the specified etat
        const actifs = yield prisma.actif.findMany({
            where: { etatId },
            include: {
                actiftype: {
                    include: {
                        category: true,
                    },
                },
                status: true,
                etat: true,
                specification: true,
                marque: true,
                modele: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data to make it easier to work with in the frontend
        const transformedActifs = actifs.map((actif) => (Object.assign(Object.assign({}, actif), { marqueObj: actif.marque, modeleObj: actif.modele, employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving actifs by etat:", error);
        res.status(500).json({
            message: "Failed to retrieve actifs by etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifsByEtat = getActifsByEtat;
/**
 * Get actifs by serial number
 */
const getActifBySerialNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { serialNumber } = req.params;
        const actif = yield prisma.actif.findUnique({
            where: { serialNumber },
            include: {
                actiftype: true,
                status: true,
                etat: true,
                specification: true,
                attachments: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Transform the data to make it easier to work with in the frontend
        const transformedActif = Object.assign(Object.assign({}, actif), { employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) });
        res.json(transformedActif);
    }
    catch (error) {
        console.error("Error retrieving actif by serial number:", error);
        res.status(500).json({
            message: "Failed to retrieve actif by serial number",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActifBySerialNumber = getActifBySerialNumber;
/**
 * Update actif status
 */
const updateActifStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { statusId } = req.body;
        if (!statusId) {
            res.status(400).json({ message: "Status ID is required" });
            return;
        }
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Verify the status exists
        const status = yield prisma.status.findUnique({
            where: { statusId },
        });
        if (!status) {
            res.status(404).json({ message: "Status not found" });
            return;
        }
        // Update the actif status
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                statusId,
            },
            include: {
                status: true,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif status:", error);
        res.status(500).json({
            message: "Failed to update actif status",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifStatus = updateActifStatus;
/**
 * Update actif etat
 */
const updateActifEtat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { etatId } = req.body;
        if (!etatId) {
            res.status(400).json({ message: "Etat ID is required" });
            return;
        }
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Verify the etat exists
        const etat = yield prisma.etat.findUnique({
            where: { etatId },
        });
        if (!etat) {
            res.status(404).json({ message: "Etat not found" });
            return;
        }
        // Update the actif etat
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                etatId,
            },
            include: {
                etat: true,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif etat:", error);
        res.status(500).json({
            message: "Failed to update actif etat",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifEtat = updateActifEtat;
/**
 * Get expiring actifs
 */
const getExpiringActifs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        // Get days parameter, default to 30 days
        const days = req.query.days ? parseInt(req.query.days, 10) : 30;
        // Calculate the date range
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        // Get actifs with warranty ending in the specified range
        const expiringActifs = yield prisma.actif.findMany({
            where: {
                warrantyEnd: {
                    gte: today,
                    lte: futureDate,
                },
            },
            include: {
                actiftype: {
                    include: {
                        category: true,
                    },
                },
                status: true,
                etat: true,
                specification: true,
                attachments: true,
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
                employees: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Transform the data
        const transformedActifs = expiringActifs.map((actif) => (Object.assign(Object.assign({}, actif), { employees: actif.employees.map((ea) => (Object.assign(Object.assign({}, ea.employee), { quantity: ea.quantity, assignedAt: ea.assignedAt }))), suppliers: actif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })), daysUntilExpiry: Math.ceil((new Date(actif.warrantyEnd).getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)) })));
        res.json(transformedActifs);
    }
    catch (error) {
        console.error("Error retrieving expiring actifs:", error);
        res.status(500).json({
            message: "Failed to retrieve expiring actifs",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getExpiringActifs = getExpiringActifs;
/**
 * Update actif quantity
 */
const updateActifQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { quantity } = req.body;
        if (quantity === undefined) {
            res.status(400).json({ message: "Quantity is required" });
            return;
        }
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            res.status(400).json({ message: "Quantity must be a positive integer" });
            return;
        }
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Update the actif quantity
        const updatedActif = yield prisma.actif.update({
            where: { actifId },
            data: {
                quantity: parsedQuantity,
            },
        });
        res.status(200).json(updatedActif);
    }
    catch (error) {
        console.error("Error updating actif quantity:", error);
        res.status(500).json({
            message: "Failed to update actif quantity",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateActifQuantity = updateActifQuantity;
/**
 * Update supplier information
 */
const updateSupplierInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = getPrismaClient(req);
        const { actifId } = req.params;
        const { supplierAllocations, useMultipleSuppliers } = req.body;
        // Verify the actif exists
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
            include: {
                fournisseurs: true,
            },
        });
        if (!actif) {
            res.status(404).json({ message: "Actif not found" });
            return;
        }
        // Process supplier information based on the mode
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // First, remove all existing supplier relations
            yield prismaClient.actifFournisseur.deleteMany({
                where: { actifId },
            });
            // If using multiple suppliers
            if (useMultipleSuppliers === "true" && supplierAllocations) {
                let parsedAllocations;
                try {
                    parsedAllocations = JSON.parse(supplierAllocations);
                }
                catch (e) {
                    throw new Error("Invalid supplier allocations format");
                }
                // Create new supplier relations
                for (const allocation of parsedAllocations) {
                    yield prismaClient.actifFournisseur.create({
                        data: {
                            actifId,
                            fournisseurId: allocation.fournisseurId,
                            quantity: parseInt(allocation.quantity, 10),
                            assignedAt: new Date(),
                        },
                    });
                }
            }
            else if (req.body.fournisseurId) {
                // Single supplier mode
                yield prismaClient.actifFournisseur.create({
                    data: {
                        actifId,
                        fournisseurId: req.body.fournisseurId,
                        quantity: actif.quantity,
                        assignedAt: new Date(),
                    },
                });
            }
        }));
        // Get the updated actif with suppliers
        const updatedActif = yield prisma.actif.findUnique({
            where: { actifId },
            include: {
                fournisseurs: {
                    include: {
                        fournisseur: true,
                    },
                },
            },
        });
        // Transform for response
        const response = Object.assign(Object.assign({}, updatedActif), { suppliers: updatedActif === null || updatedActif === void 0 ? void 0 : updatedActif.fournisseurs.map((af) => ({
                fournisseurId: af.fournisseur.fournisseurId,
                name: af.fournisseur.name,
                email: af.fournisseur.email,
                phone: af.fournisseur.phone,
                quantity: af.quantity,
                assignedAt: af.assignedAt,
            })) });
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error updating supplier information:", error);
        res.status(500).json({
            message: "Failed to update supplier information",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateSupplierInfo = updateSupplierInfo;
