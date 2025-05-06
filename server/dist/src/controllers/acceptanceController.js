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
exports.rejectAssignment = exports.acceptAssignment = exports.resendAssignmentInvitation = exports.validateAssignmentToken = void 0;
const client_1 = require("@prisma/client");
const tokenService_1 = require("../services/tokenService");
const emailServices_1 = require("../services/emailServices");
const auto_tagMidlleware_1 = require("../middleware/auto-tagMidlleware");
const lagomPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
}));
const insightPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
}));
// Helper function to get the right client
function getPrismaClient(database) {
    console.log(`Getting Prisma client for database: ${database || "insight (default)"}`);
    return database === "lagom" ? lagomPrisma : insightPrisma;
}
/**
 * Validate an assignment token and return information about the assignment
 */
const validateAssignmentToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Debug logging
        console.log("Request headers:", req.headers);
        console.log("Token to validate:", req.params.token);
        const { token } = req.params;
        // Verify the token and extract database info
        const decoded = (0, tokenService_1.verifyAssignmentToken)(token);
        if (!decoded) {
            console.log("Token verification failed - invalid JWT format");
            res
                .status(400)
                .json({ valid: false, message: "Token invalide ou expiré" });
            return;
        }
        console.log("Decoded token:", decoded);
        // Extract database from token if available, default to insight
        const selectedDatabase = decoded.database || "insight";
        console.log(`Using database from token: ${selectedDatabase}`);
        // Get the appropriate Prisma client based on the database in the token
        const prisma = getPrismaClient(selectedDatabase);
        // Check if token has already been used - PASS THE DATABASE PARAMETER
        const used = yield (0, tokenService_1.isTokenUsed)(token, selectedDatabase);
        if (used) {
            console.log("Token already used");
            res
                .status(400)
                .json({ valid: false, message: "Ce lien a déjà été utilisé" });
            return;
        }
        // Get employee information
        const employee = yield prisma.employee.findUnique({
            where: { employeeId: decoded.employeeId },
        });
        if (!employee) {
            console.log(`Employee not found: ${decoded.employeeId}`);
            res.status(404).json({ valid: false, message: "Employé non trouvé" });
            return;
        }
        // Get actifs information
        const actifs = yield prisma.actif.findMany({
            where: { actifId: { in: decoded.actifIds } },
            include: {
                status: true,
                actiftype: true,
                marque: true,
                modele: true,
            },
        });
        console.log(`Found ${actifs.length} actifs for token`);
        // Check if all actifs are still reserved for this employee
        const reservedStatus = yield prisma.status.findFirst({
            where: { name: "Réservé" },
        });
        if (!reservedStatus) {
            console.error('Status "Réservé" not found in database');
            res.status(500).json({
                valid: false,
                message: 'Statut "Réservé" non trouvé dans le système',
            });
            return;
        }
        console.log(`Reserved status ID: ${reservedStatus.statusId}`);
        // Check if any actifs are no longer reserved
        const nonReservedActifs = actifs.filter((actif) => actif.statusId !== reservedStatus.statusId);
        if (nonReservedActifs.length > 0) {
            console.log("Some actifs are no longer reserved:", nonReservedActifs.map((a) => a.actifId));
            res.status(400).json({
                valid: false,
                message: "Certains équipements ne sont plus réservés pour vous",
                nonReservedActifs: nonReservedActifs.map((a) => {
                    var _a, _b;
                    return ({
                        actifId: a.actifId,
                        marque: ((_a = a.marque) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                        modele: ((_b = a.modele) === null || _b === void 0 ? void 0 : _b.name) || "Unknown",
                    });
                }),
            });
            return;
        }
        // Transform actifs for response, including quantities
        const actifDetails = actifs.map((actif) => {
            var _a, _b, _c, _d;
            const quantity = ((_a = decoded.quantities) === null || _a === void 0 ? void 0 : _a[actif.actifId]) || 1;
            return {
                actifId: actif.actifId,
                marque: ((_b = actif.marque) === null || _b === void 0 ? void 0 : _b.name) || "Unknown", // Access through relation
                modele: ((_c = actif.modele) === null || _c === void 0 ? void 0 : _c.name) || "Unknown", // Access through relation
                serialNumber: actif.serialNumber,
                type: ((_d = actif.actiftype) === null || _d === void 0 ? void 0 : _d.nom) || actif.actifType,
                quantity,
            };
        });
        console.log("Token validation successful");
        // Return success response with assignment details
        res.status(200).json({
            valid: true,
            employee: {
                employeeId: employee.employeeId,
                nom: employee.nom,
                email: employee.email,
            },
            actifs: actifDetails,
        });
    }
    catch (error) {
        console.error("Error validating assignment token:", error);
        // Enhanced error reporting
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        res.status(500).json({
            valid: false,
            message: "Une erreur est survenue lors de la validation du token",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.validateAssignmentToken = validateAssignmentToken;
/**
 * Resend assignment invitation email
 */
const resendAssignmentInvitation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { employeeId, actifId, database } = req.body;
        const selectedDatabase = database || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) || "insight";
        const prisma = getPrismaClient(selectedDatabase);
        if (!employeeId || !actifId) {
            res.status(400).json({
                success: false,
                message: "Employee ID and actif ID are required",
            });
            return;
        }
        // Get employee
        const employee = yield prisma.employee.findUnique({
            where: { employeeId },
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: "Employee not found",
            });
            return;
        }
        // Get actif and check if it's in "Réservé" status
        const actif = yield prisma.actif.findUnique({
            where: { actifId },
            include: {
                status: true,
            },
        });
        if (!actif) {
            res.status(404).json({
                success: false,
                message: "Actif not found",
            });
            return;
        }
        // Verify actif is in "Réservé" status
        if (((_b = actif.status) === null || _b === void 0 ? void 0 : _b.name) !== "Réservé") {
            res.status(400).json({
                success: false,
                message: "Cannot resend invitation for actif that is not in 'Réservé' status",
            });
            return;
        }
        // Find the existing assignment token for this actif and employee
        const existingToken = yield prisma.assignmentToken.findFirst({
            where: {
                employeeId,
                actifIds: {
                    has: actifId,
                },
                status: "PENDING",
            },
        });
        if (!existingToken) {
            res.status(404).json({
                success: false,
                message: "No pending assignment found for this actif and employee",
            });
            return;
        }
        // Send a new email with the token
        const emailSent = yield (0, emailServices_1.sendAssignmentNotification)(employee, [actif], existingToken.token);
        if (!emailSent) {
            res.status(500).json({
                success: false,
                message: "Failed to send email notification",
                emailSent: false,
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Assignment invitation resent successfully",
            emailSent: true,
        });
    }
    catch (error) {
        console.error("Error resending assignment invitation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to resend assignment invitation",
            emailSent: false,
        });
    }
});
exports.resendAssignmentInvitation = resendAssignmentInvitation;
/**
 * Accept an assignment after employee confirmation
 */
const acceptAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Add debug logging
        console.log("Accept assignment request:", req.params, req.body);
        const { token } = req.params;
        const { acceptTerms } = req.body;
        // Verify acceptance of terms
        if (!acceptTerms) {
            res.status(400).json({
                success: false,
                message: "Vous devez accepter les conditions générales pour confirmer l'assignation",
            });
            return;
        }
        // Verify the token and extract database info
        const decoded = (0, tokenService_1.verifyAssignmentToken)(token);
        if (!decoded) {
            console.log("Token verification failed in acceptAssignment");
            res
                .status(400)
                .json({ success: false, message: "Token invalide ou expiré" });
            return;
        }
        // Extract database from token if available, default to insight
        const selectedDatabase = decoded.database || "insight";
        console.log(`Using database from token: ${selectedDatabase}`);
        // Get the appropriate Prisma client based on the database in the token
        const prisma = getPrismaClient(selectedDatabase);
        // Check if token has already been used
        const used = yield (0, tokenService_1.isTokenUsed)(token, selectedDatabase);
        if (used) {
            console.log("Token already used in acceptAssignment");
            res
                .status(400)
                .json({ success: false, message: "Ce lien a déjà été utilisé" });
            return;
        }
        // Get employee and actifs
        const employee = yield prisma.employee.findUnique({
            where: { employeeId: decoded.employeeId },
        });
        if (!employee) {
            res.status(404).json({ success: false, message: "Employé non trouvé" });
            return;
        }
        // Find the "Assigned" status to update actifs
        const assignedStatus = yield prisma.status.findFirst({
            where: { name: "Assigné" },
        });
        if (!assignedStatus) {
            res.status(500).json({
                success: false,
                message: 'Statut "Assigné" non trouvé dans le système',
            });
            return;
        }
        // Execute all operations in a transaction
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Update status of all actifs to "Assigned"
            for (const actifId of decoded.actifIds || []) {
                yield prismaClient.actif.update({
                    where: { actifId },
                    data: { statusId: assignedStatus.statusId },
                });
            }
            // Get the updated actifs to include in the confirmation email
            const actifs = yield prismaClient.actif.findMany({
                where: { actifId: { in: decoded.actifIds } },
            });
            // Mark the token as accepted - PASS THE DATABASE PARAMETER
            yield (0, tokenService_1.updateTokenStatus)(token, "ACCEPTED", selectedDatabase);
            // Send acceptance confirmation email
            yield (0, emailServices_1.sendAcceptanceConfirmation)(employee, actifs);
        }));
        // Return success response
        res.status(200).json({
            success: true,
            message: "Assignation acceptée avec succès",
            employeeId: decoded.employeeId,
            actifIds: decoded.actifIds,
        });
    }
    catch (error) {
        console.error("Error accepting assignment:", error);
        // Enhanced error reporting
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de l'acceptation de l'assignation",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.acceptAssignment = acceptAssignment;
/**
 * Reject an assignment
 */
const rejectAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Add debug logging
        console.log("Reject assignment request:", req.params, req.body);
        const { token } = req.params;
        const { reason } = req.body;
        // Verify the token and extract database info
        const decoded = (0, tokenService_1.verifyAssignmentToken)(token);
        if (!decoded) {
            console.log("Token verification failed in rejectAssignment");
            res
                .status(400)
                .json({ success: false, message: "Token invalide ou expiré" });
            return;
        }
        // Extract database from token if available, default to insight
        const selectedDatabase = decoded.database || "insight";
        console.log(`Using database from token: ${selectedDatabase}`);
        // Get the appropriate Prisma client based on the database in the token
        const prisma = getPrismaClient(selectedDatabase);
        // Check if token has already been used
        const used = yield (0, tokenService_1.isTokenUsed)(token, selectedDatabase);
        if (used) {
            console.log("Token already used in rejectAssignment");
            res
                .status(400)
                .json({ success: false, message: "Ce lien a déjà été utilisé" });
            return;
        }
        // Find the "Disponible" status to return actifs to stock
        const availableStatus = yield prisma.status.findFirst({
            where: { name: "Disponible" },
        });
        if (!availableStatus) {
            res.status(500).json({
                success: false,
                message: 'Statut "Disponible" non trouvé dans le système',
            });
            return;
        }
        // Execute all operations in a transaction
        yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
            // Update status of all actifs back to "Disponible"
            for (const actifId of decoded.actifIds || []) {
                yield prismaClient.actif.update({
                    where: { actifId },
                    data: { statusId: availableStatus.statusId },
                });
                // Remove the employee-actif relationship
                yield prismaClient.employeeActif.deleteMany({
                    where: {
                        employeeId: decoded.employeeId,
                        actifId,
                    },
                });
            }
            // Mark the token as rejected - PASS THE DATABASE PARAMETER
            yield (0, tokenService_1.updateTokenStatus)(token, "REJECTED", selectedDatabase);
            // Log the rejection reason
            console.log(`Assignment rejected by employee ${decoded.employeeId}. Reason: ${reason || "Not provided"}`);
        }));
        // Return success response
        res.status(200).json({
            success: true,
            message: "Assignation refusée avec succès",
            employeeId: decoded.employeeId,
            actifIds: decoded.actifIds,
        });
    }
    catch (error) {
        console.error("Error rejecting assignment:", error);
        // Enhanced error reporting
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors du refus de l'assignation",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.rejectAssignment = rejectAssignment;
