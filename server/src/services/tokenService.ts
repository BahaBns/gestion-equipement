// services/tokenService.ts
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Initialize PrismaClient instances for each database
const lagomPrisma = new PrismaClient({
  datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
});

const insightPrisma = new PrismaClient({
  datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
});

// Helper function to get the right Prisma client based on database selection
const getPrismaClient = (database?: string) => {
  console.log(
    `Getting Prisma client for database: ${database || "insight (default)"}`
  );
  return database === "lagom" ? lagomPrisma : insightPrisma;
};

// Get JWT secret from environment variables or use a default (for development only)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
// Token expiration time (7 days by default)
const TOKEN_EXPIRY = "7d";

/**
 * Interface for the assignment token payload data
 */
interface TokenPayload {
  employeeId: string;
  actifIds?: string[];
  licenseIds?: string[];
  quantities?: Record<string, number>;
  type: "actif" | "license"; // Specify the type of assignment
  database?: string; // Store the database name in the token
  exp?: number;
  iat?: number;
}

/**
 * Generate a JWT token for equipment assignment acceptance
 *
 * @param employeeId The ID of the employee
 * @param actifIds Array of actif IDs being assigned
 * @param quantities Optional record of quantities for each actif
 * @param database The database where the assignment is stored
 * @returns String containing the generated JWT token
 */
export const generateAssignmentToken = (
  employeeId: string,
  actifIds: string[],
  quantities?: Record<string, number>,
  database?: string
): string => {
  // Create payload
  const payload: TokenPayload = {
    employeeId,
    actifIds,
    quantities,
    type: "actif",
    database: database || "insight", // Include the database in the token
  };

  // Generate token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Generate a JWT token for license assignment acceptance
 *
 * @param employeeId The ID of the employee
 * @param licenseIds Array of license IDs being assigned
 * @param quantities Optional record of quantities for each license
 * @param database The database where the assignment is stored
 * @returns String containing the generated JWT token
 */
export const generateLicenseAssignmentToken = (
  employeeId: string,
  licenseIds: string[],
  quantities?: Record<string, number>,
  database?: string
): string => {
  // Create payload
  const payload: TokenPayload = {
    employeeId,
    licenseIds,
    quantities,
    type: "license",
    database: database || "insight", // Include the database in the token
  };

  // Generate token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Verify and decode an assignment token
 *
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyAssignmentToken = (token: string): TokenPayload | null => {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

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
export const storeAssignmentToken = async (
  token: string,
  employeeId: string,
  itemIds: string[],
  expiresAt: Date,
  type: "actif" | "license",
  database?: string
): Promise<void> => {
  try {
    // Get the appropriate Prisma client
    const prisma = getPrismaClient(database);

    console.log(
      `Storing token in database: ${database || "insight (default)"}`
    );

    // Create a unique token ID
    const tokenId = `token-${crypto.randomBytes(16).toString("hex")}`;

    // Store the token in database
    await prisma.assignmentToken.create({
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
  } catch (error) {
    console.error("Failed to store assignment token:", error);
    throw error;
  }
};

/**
 * Update token status after it's been used
 *
 * @param token The JWT token to update
 * @param status The new status ('ACCEPTED', 'REJECTED', 'EXPIRED')
 * @param database The selected database ('lagom' or 'insight')
 */
export const updateTokenStatus = async (
  token: string,
  status: "ACCEPTED" | "REJECTED" | "EXPIRED",
  database?: string
): Promise<void> => {
  try {
    // Get the appropriate Prisma client
    const prisma = getPrismaClient(database);

    await prisma.assignmentToken.updateMany({
      where: { token },
      data: {
        status,
        usedAt: status !== "EXPIRED" ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to update token status to ${status}:`, error);
    throw error;
  }
};

/**
 * Check if a token has already been used
 *
 * @param token The JWT token to check
 * @param database The selected database ('lagom' or 'insight')
 * @returns Boolean indicating if the token has been used
 */
export const isTokenUsed = async (
  token: string,
  database?: string
): Promise<boolean> => {
  try {
    // Get the appropriate Prisma client
    const prisma = getPrismaClient(database);

    const tokenRecord = await prisma.assignmentToken.findFirst({
      where: { token },
    });

    if (!tokenRecord) {
      return false; // Token not found in database
    }

    return tokenRecord.status !== "PENDING";
  } catch (error) {
    console.error("Failed to check token status:", error);
    throw error;
  }
};
