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
exports.isTokenUsed = exports.updateTokenStatus = exports.storeAssignmentToken = exports.verifyAssignmentToken = exports.generateLicenseAssignmentToken = exports.generateAssignmentToken = void 0;
// services/tokenService.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize PrismaClient instances for each database
const lagomPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});
const insightPrisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});
// Helper function to get the right Prisma client based on database selection
const getPrismaClient = (database) => {
    console.log(`Getting Prisma client for database: ${database || "insight (default)"}`);
    return database === "lagom" ? lagomPrisma : insightPrisma;
};
// Get JWT secret from environment variables or use a default (for development only)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
// Token expiration time (7 days by default)
const TOKEN_EXPIRY = "7d";
/**
 * Generate a JWT token for equipment assignment acceptance
 *
 * @param employeeId The ID of the employee
 * @param actifIds Array of actif IDs being assigned
 * @param quantities Optional record of quantities for each actif
 * @param database The database where the assignment is stored
 * @returns String containing the generated JWT token
 */
const generateAssignmentToken = (employeeId, actifIds, quantities, database) => {
    // Create payload
    const payload = {
        employeeId,
        actifIds,
        quantities,
        type: "actif",
        database: database || "insight", // Include the database in the token
    };
    // Generate token
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};
exports.generateAssignmentToken = generateAssignmentToken;
/**
 * Generate a JWT token for license assignment acceptance
 *
 * @param employeeId The ID of the employee
 * @param licenseIds Array of license IDs being assigned
 * @param quantities Optional record of quantities for each license
 * @param database The database where the assignment is stored
 * @returns String containing the generated JWT token
 */
const generateLicenseAssignmentToken = (employeeId, licenseIds, quantities, database) => {
    // Create payload
    const payload = {
        employeeId,
        licenseIds,
        quantities,
        type: "license",
        database: database || "insight", // Include the database in the token
    };
    // Generate token
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};
exports.generateLicenseAssignmentToken = generateLicenseAssignmentToken;
/**
 * Verify and decode an assignment token
 *
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
const verifyAssignmentToken = (token) => {
    try {
        // Verify and decode the token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
};
exports.verifyAssignmentToken = verifyAssignmentToken;
/**
 * Store assignment token in database for tracking
 * This allows for token revocation and tracking states
 *
 * @param token The JWT token
 * @param employeeId The employee ID
 * @param itemIds The IDs included in this assignment
 * @param expiresAt When the token expires
 * @param type The type of assignment ('actif' or 'license')
 * @param database The selected database ('lagom' or 'insight')
 */
const storeAssignmentToken = (token, employeeId, itemIds, expiresAt, type, database) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the appropriate Prisma client
        const prisma = getPrismaClient(database);
        console.log(`Storing token in database: ${database || "insight (default)"}`);
        // Create a unique token ID
        const tokenId = `token-${crypto_1.default.randomBytes(16).toString("hex")}`;
        // Store the token in database
        yield prisma.assignmentToken.create({
            data: {
                tokenId,
                token,
                employeeId,
                actifIds: type === "actif" ? itemIds : [], // Only set if type is actif
                licenseIds: type === "license" ? itemIds : [], // Only set if type is license
                type,
                issuedAt: new Date(),
                expiresAt,
                status: "PENDING",
            },
        });
    }
    catch (error) {
        console.error("Failed to store assignment token:", error);
        throw error;
    }
});
exports.storeAssignmentToken = storeAssignmentToken;
/**
 * Update token status after it's been used
 *
 * @param token The JWT token to update
 * @param status The new status ('ACCEPTED', 'REJECTED', 'EXPIRED')
 * @param database The selected database ('lagom' or 'insight')
 */
const updateTokenStatus = (token, status, database) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the appropriate Prisma client
        const prisma = getPrismaClient(database);
        yield prisma.assignmentToken.updateMany({
            where: { token },
            data: {
                status,
                usedAt: status !== "EXPIRED" ? new Date() : undefined,
            },
        });
    }
    catch (error) {
        console.error(`Failed to update token status to ${status}:`, error);
        throw error;
    }
});
exports.updateTokenStatus = updateTokenStatus;
/**
 * Check if a token has already been used
 *
 * @param token The JWT token to check
 * @param database The selected database ('lagom' or 'insight')
 * @returns Boolean indicating if the token has been used
 */
const isTokenUsed = (token, database) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the appropriate Prisma client
        const prisma = getPrismaClient(database);
        const tokenRecord = yield prisma.assignmentToken.findFirst({
            where: { token },
        });
        if (!tokenRecord) {
            return false; // Token not found in database
        }
        return tokenRecord.status !== "PENDING";
    }
    catch (error) {
        console.error("Failed to check token status:", error);
        throw error;
    }
});
exports.isTokenUsed = isTokenUsed;
